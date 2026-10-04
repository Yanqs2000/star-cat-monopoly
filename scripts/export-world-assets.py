"""Export original world timelines and neutral houses as browser-only PNG/JSON assets."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import time

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
JAVA_SOURCE = ROOT / "scripts/ExportWorldAssets.java"
CACHE = ROOT / ".analysis-cache/world-assets"
HOUSE_BOUNDS = (-360, 1440, -1373, 1107)


@dataclass(frozen=True)
class Clip:
    id: str
    source_symbol: int
    frames: int
    bounds: tuple[int, int, int, int]
    loop: bool
    nested_children: tuple[int, ...]

    @property
    def size(self) -> tuple[int, int]:
        return canvas_size(self.bounds)

    @property
    def offset(self) -> tuple[float, float]:
        return self.bounds[0] / 20, self.bounds[2] / 20


CLIPS = (
    Clip("npc-1", 298, 3, (0, 1140, -2000, 800), True, (297,)),
    Clip("npc-2", 310, 54, (-180, 1620, -1600, 800), True, (309,)),
    Clip("npc-3", 372, 12, (-260, 1440, -1320, 800), True, (371,)),
    Clip("npc-4", 226, 55, (-198, 1342, -1600, 800), True, (225,)),
    Clip("npc-5", 335, 22, (-1320, 1160, -1780, 800), True, (334,)),
    Clip("npc-9", 293, 104, (0, 1140, -720, 800), True, (292,)),
    Clip("npc-10", 361, 18, (-400, 1560, -1540, 800), True, (360,)),
    Clip("npc-11", 350, 18, (-620, 1780, -1620, 800), True, (349,)),
    Clip("npc-12", 263, 81, (0, 1157, -1283, 800), True, (262,)),
    Clip("npc-13", 280, 33, (0, 1180, -906, 800), True, (279,)),
    Clip("npc-14", 248, 24, (-200, 1560, -1466, 800), True, (247,)),
    Clip("npc-15", 235, 26, (0, 1119, -1266, 800), True, (234,)),
    Clip("barrier-1", 3689, 10, (-240, 1660, -1440, 960), True, (3685,)),
    Clip("barrier-2", 3689, 10, (-240, 1660, -1440, 960), True, (3688,)),
    Clip("barrier-3", 3689, 10, (-240, 1660, -1440, 960), True, (3685,)),
    Clip("barrier-4", 3689, 10, (-240, 1660, -1440, 960), True, (3688,)),
    Clip("mine", 3696, 80, (12, 1061, -719, 801), True, ()),
    Clip("rocket", 1080, 80, (-1651, 2789, -3913, 2310), False, (1048, 1079)),
    Clip("explosion", 1027, 60, (-1620, 2760, -3193, 1887), False, (1026,)),
    Clip("card-gain", 1163, 50, (14, 1174, -4020, -680), False, ()),
    Clip("ticket-gain", 1185, 30, (224, 964, -3420, -860), False, ()),
)


def canvas_size(bounds: tuple[int, int, int, int] | list[int]) -> tuple[int, int]:
    return math.ceil((bounds[1] - bounds[0]) / 20), math.ceil((bounds[3] - bounds[2]) / 20)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def decoded_rgba(path: Path, expected_size: tuple[int, int], density: int = 1) -> Image.Image:
    with Image.open(path) as source:
        source.load()
        if source.format != "PNG" or source.mode != "RGBA" or source.size != expected_size:
            raise SystemExit(
                f"Unexpected native RGBA PNG: {path} "
                f"({source.format} {source.mode} {source.size}, expected {expected_size})"
            )
        return source.copy()


def normalize_png(source: Path, target: Path, render_bounds: list[int],
                  target_bounds: tuple[int, int, int, int], density: int = 1) -> None:
    render_size = (math.ceil((render_bounds[1] - render_bounds[0]) * density / 20),
                   math.ceil((render_bounds[3] - render_bounds[2]) * density / 20))
    image = decoded_rgba(source, render_size, density)
    shift_twips = (render_bounds[0] - target_bounds[0], render_bounds[2] - target_bounds[2])
    if shift_twips[0] * density % 20 or shift_twips[1] * density % 20:
        raise SystemExit(f"Non-pixel-aligned render origin: {source} {shift_twips}")
    shift = shift_twips[0] * density // 20, shift_twips[1] * density // 20
    target_size = canvas_size(target_bounds)
    canvas = Image.new("RGBA", (target_size[0] * density, target_size[1] * density), (0, 0, 0, 0))
    if shift[0] < 0 or shift[1] < 0 or shift[0] + image.width > canvas.width \
            or shift[1] + image.height > canvas.height:
        raise SystemExit(f"Rendered frame exceeds source canvas: {source}")
    canvas.alpha_composite(image, shift)
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target)


def normalize_exports(raw: Path, staging: Path, metadata: dict[str, object], density: int = 1) -> None:
    clip_metadata = {item["id"]: item for item in metadata["clips"]}
    if set(clip_metadata) != {clip.id for clip in CLIPS}:
        raise SystemExit("Java exporter returned unexpected clip metadata")
    for clip in CLIPS:
        item = clip_metadata[clip.id]
        expected = {
            "sourceSymbol": clip.source_symbol,
            "frames": clip.frames,
            "nestedChildren": list(clip.nested_children),
            "targetBoundsTwips": list(clip.bounds),
        }
        for key, value in expected.items():
            if item.get(key) != value:
                raise SystemExit(f"Unexpected {clip.id} {key}: {item.get(key)}")
        for frame in range(1, clip.frames + 1):
            normalize_png(
                raw / clip.id / f"{frame}.png",
                staging / clip.id / f"{frame}.png",
                item["renderBoundsTwips"],
                clip.bounds,
                density,
            )

    house_metadata = metadata["neutralHouses"]
    expected_house_metadata = {
        "sourceSymbol": 3401,
        "sourceFrames": 40,
        "landSymbol": 3147,
        "landFrame": 7,
        "targetBoundsTwips": list(HOUSE_BOUNDS),
    }
    for key, value in expected_house_metadata.items():
        if house_metadata.get(key) != value:
            raise SystemExit(f"Unexpected neutral house {key}: {house_metadata.get(key)}")
    for facing in range(1, 5):
        for level in range(1, 6):
            normalize_png(
                raw / f"neutral-houses/{facing}/{level}.png",
                staging / f"neutral-houses/{facing}/{level}.png",
                house_metadata["renderBoundsTwips"],
                HOUSE_BOUNDS,
                density,
            )


def image_hash(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def validate(staging: Path) -> dict[str, object]:
    expected_paths = {
        staging / clip.id / f"{frame}.png"
        for clip in CLIPS
        for frame in range(1, clip.frames + 1)
    } | {
        staging / f"neutral-houses/{facing}/{level}.png"
        for facing in range(1, 5)
        for level in range(1, 6)
    }
    actual_paths = set(staging.rglob("*.png"))
    if actual_paths != expected_paths or len(actual_paths) != 810:
        raise SystemExit(
            f"Exporter must produce exactly 810 canonical PNGs, got {len(actual_paths)}"
        )

    unique_frames: dict[str, int] = {}
    visible_frames: dict[str, int] = {}
    always_visible = {
        *(clip.id for clip in CLIPS if clip.id.startswith("npc-")),
        "barrier-1", "barrier-2", "barrier-3", "barrier-4",
        "mine",
    }
    expected_visible = {"rocket": 49, "explosion": 58, "card-gain": 49, "ticket-gain": 29}
    for clip in CLIPS:
        hashes: set[str] = set()
        visible = 0
        for frame in range(1, clip.frames + 1):
            image = decoded_rgba(staging / clip.id / f"{frame}.png", clip.size)
            hashes.add(image_hash(image))
            if image.getchannel("A").getbbox() is not None:
                visible += 1
        if clip.id in always_visible and visible != clip.frames:
            raise SystemExit(f"Unexpected empty frame in {clip.id}: {visible}/{clip.frames}")
        if clip.id in expected_visible and visible != expected_visible[clip.id]:
            raise SystemExit(f"Unexpected visible frame count in {clip.id}: {visible}")
        if visible == 0:
            raise SystemExit(f"Clip has no visible geometry: {clip.id}")
        unique_frames[clip.id] = len(hashes)
        visible_frames[clip.id] = visible

    house_size = canvas_size(HOUSE_BOUNDS)
    for facing in range(1, 5):
        for level in range(1, 6):
            neutral = decoded_rgba(
                staging / f"neutral-houses/{facing}/{level}.png", house_size
            )
            if neutral.getchannel("A").getbbox() is None:
                raise SystemExit(f"Neutral house is empty: {facing}/{level}")
            for owner in range(1, 5):
                owner_path = ROOT / (
                    f"public/modern/assets/properties/houses/owner-{owner}/"
                    f"facing-{facing}/level-{level}.png"
                )
                owner_image = decoded_rgba(owner_path, house_size)
                if ImageChops.difference(neutral, owner_image).getbbox() is None:
                    raise SystemExit(
                        f"Neutral house reused owner {owner} color: facing {facing}, level {level}"
                    )

    return {
        "decodedPngCounts": {"clipFrames": 790, "neutralHouses": 20, "total": 810},
        "uniqueFrameHashes": unique_frames,
        "visibleFrameCounts": visible_frames,
    }


def manifest(source_hash: str) -> dict[str, object]:
    return {
        "version": 1,
        "sourceSha256": source_hash,
        "clips": [
            {
                "id": clip.id,
                "fps": 30,
                "loop": clip.loop,
                "sourceSymbol": clip.source_symbol,
                "frames": [
                    {
                        "url": f"assets/world/{clip.id}/{frame}.png",
                        "width": clip.size[0],
                        "height": clip.size[1],
                        "offsetX": clip.offset[0],
                        "offsetY": clip.offset[1],
                    }
                    for frame in range(1, clip.frames + 1)
                ],
            }
            for clip in CLIPS
        ],
        "neutralHouses": [
            {
                "facing": facing,
                "level": level,
                "sourceFrame": (facing - 1) * 10 + level + 1,
                "url": f"assets/world/neutral-houses/{facing}/{level}.png",
                "width": canvas_size(HOUSE_BOUNDS)[0],
                "height": canvas_size(HOUSE_BOUNDS)[1],
                "offsetX": HOUSE_BOUNDS[0] / 20,
                "offsetY": HOUSE_BOUNDS[2] / 20,
            }
            for facing in range(1, 5)
            for level in range(1, 6)
        ],
    }


def thumb(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy


def build_timeline_sheet(staging: Path, target: Path, clips: tuple[Clip, ...]) -> None:
    columns = 3
    cell_width, cell_height = 180, 160
    margin, label_height = 18, 26
    sheet = Image.new(
        "RGB",
        (margin * 2 + columns * cell_width, margin * 2 + len(clips) * cell_height),
        (31, 34, 40),
    )
    draw = ImageDraw.Draw(sheet)
    for row, clip in enumerate(clips):
        samples = (1, (clip.frames + 1) // 2, clip.frames)
        for column, frame in enumerate(samples):
            x = margin + column * cell_width
            y = margin + row * cell_height
            draw.text((x + 5, y + 4), f"{clip.id}  {frame}/{clip.frames}", fill=(245, 245, 245))
            image = decoded_rgba(staging / clip.id / f"{frame}.png", clip.size)
            preview = thumb(image, (160, 124))
            px = x + (cell_width - preview.width) // 2
            py = y + label_height + (cell_height - label_height - preview.height) // 2
            sheet.paste(preview, (px, py), preview)
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)


def build_house_sheet(staging: Path, target: Path) -> None:
    margin, label_height, cell_width, cell_height = 18, 28, 112, 158
    sheet = Image.new(
        "RGB", (margin * 2 + 5 * cell_width, margin * 2 + 4 * cell_height), (31, 34, 40)
    )
    draw = ImageDraw.Draw(sheet)
    for facing in range(1, 5):
        for level in range(1, 6):
            x = margin + (level - 1) * cell_width
            y = margin + (facing - 1) * cell_height
            draw.text((x + 4, y + 4), f"F{facing} L{level}", fill=(245, 245, 245))
            image = decoded_rgba(
                staging / f"neutral-houses/{facing}/{level}.png", canvas_size(HOUSE_BOUNDS)
            )
            sheet.paste(image, (x + 11, y + label_height), image)
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)


def build_contact_sheets(staging: Path) -> list[Path]:
    npc_sheet = CACHE / "npc-contact-sheet.png"
    effects_sheet = CACHE / "effects-contact-sheet.png"
    houses_sheet = CACHE / "neutral-houses-contact-sheet.png"
    build_timeline_sheet(staging, npc_sheet, tuple(clip for clip in CLIPS if clip.id.startswith("npc-")))
    build_timeline_sheet(staging, effects_sheet, tuple(clip for clip in CLIPS if not clip.id.startswith("npc-")))
    build_house_sheet(staging, houses_sheet)
    return [npc_sheet, effects_sheet, houses_sheet]


def report(source_hash: str, java_pid: int, driver_command: list[str],
           command: list[str], contact_sheets: list[Path]) -> str:
    clip_lines = [
        f"- `{clip.id}`: source {clip.source_symbol}, {clip.frames} frames, "
        f"{clip.size[0]} x {clip.size[1]} px, offset {clip.offset}, "
        f"{'loop' if clip.loop else 'play once'}"
        for clip in CLIPS
    ]
    return "\n".join([
        "# Task 1 world asset export report",
        "",
        "Status: complete.",
        "",
        "## Process and reproduction",
        "",
        f"- Java exporter PID for this run: `{java_pid}` (finished).",
        f"- Java source: `{JAVA_SOURCE.relative_to(ROOT)}`.",
        f"- End-to-end reproduction: `{' '.join(driver_command)}`.",
        f"- Java subprocess: `{' '.join(command)}`.",
        "- Prerequisites: JPEXS 26.2.1 `ffdec.jar`, Java, Python with Pillow, the committed original SWF/manifest, and committed owner-house assets used by neutral-color validation.",
        "- Override the defaults with `FFDEC_JAR` and `FFDEC_JAVA`; no `.analysis-cache` probe output is required.",
        "- The source SWF was opened read-only and its hash was checked before and after export.",
        "",
        "## Source and output",
        "",
        f"- `play.swf` SHA-256: `{source_hash}`.",
        "- Output: 21 clips / 790 timeline frames plus 20 neutral houses = 810 RGBA PNGs.",
        "- All timeline metadata is 30 fps. NPCs, barriers, and the mine loop; rocket, explosion, card gain, and ticket gain play once.",
        "- Neutral houses use house 3401 and empty land 3147 frame 7; none matches an owner 1-4 PNG.",
        "",
        "## Clip geometry and timing",
        "",
        *clip_lines,
        "",
        "## Nested-timeline evidence",
        "",
        "- The Java exporter validates each nested child ID/frame count and renders the controlled timelines directly from the source SWF.",
        "- One-time comparisons against the exploratory probe are review evidence only and are deliberately outside the reproducible export path.",
        "- Rocket body uses 1079 frames 1-80. Tail 1048 advances until body frame 40, stays on empty tail frame 11 through body frame 69, and restarts from tail frame 1 at body frame 70.",
        "",
        "## Contact sheets",
        "",
        *(f"- `{path.relative_to(ROOT)}`" for path in contact_sheets),
        "",
        "## Verification",
        "",
        "- Every PNG decoded as RGBA at its manifest dimensions.",
        "- Canonical file coverage and unique manifest paths were checked for all 810 outputs.",
        "- Focused Vitest and project typecheck are recorded separately after the generated files are installed.",
        "",
    ])


def main() -> None:
    jar = Path(os.environ.get(
        "FFDEC_JAR", ROOT.parents[1] / ".analysis-tools/ffdec-26.2.1/ffdec.jar"
    )).resolve()
    java = os.environ.get("FFDEC_JAVA", "/opt/homebrew/opt/openjdk/bin/java")
    if not jar.is_file():
        raise SystemExit("Set FFDEC_JAR to the verified JPEXS 26.2.1 ffdec.jar")
    version = subprocess.run(
        [java, "-Xmx2g", "-Djava.awt.headless=true", "-jar", str(jar), "-help"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    if "v.26.2.1" not in version:
        raise SystemExit("Expected JPEXS 26.2.1")

    original = ROOT / "public/original"
    source = original / "play.swf"
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    original_manifest = json.loads((original / "manifest.json").read_text())
    declared_hash = next(
        item["sha256"] for item in original_manifest["files"] if item["name"] == "play.swf"
    )
    if source_hash != declared_hash:
        raise SystemExit("Original play.swf hash mismatch")

    raw = CACHE / "raw"
    staging = CACHE / "staging"
    java_scratch = CACHE / "java"
    for generated in (raw, staging, java_scratch):
        if generated.exists():
            shutil.rmtree(generated)
    command = [
        java,
        "-Xmx2g",
        "-Djava.awt.headless=true",
        "--class-path",
        str(jar),
        str(JAVA_SOURCE),
        str(source),
        str(raw),
        str(java_scratch),
    ]
    driver_command = [sys.executable, str(JAVA_SOURCE.with_name("export-world-assets.py"))]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    run_state = {
        "status": "running",
        "pythonPid": os.getpid(),
        "javaPid": process.pid,
        "startedUnix": time.time(),
        "command": command,
    }
    write_json(CACHE / "run-state.json", run_state)
    stdout, stderr = process.communicate()
    (CACHE / "export.log").write_text(stdout + stderr)
    if process.returncode:
        write_json(CACHE / "run-state.json", {
            **run_state, "status": "failed", "returnCode": process.returncode,
            "finishedUnix": time.time(),
        })
        raise subprocess.CalledProcessError(process.returncode, command, stdout, stderr)

    lines = [line for line in stdout.splitlines() if line.strip()]
    if not lines:
        raise SystemExit("Java exporter did not return metadata")
    java_metadata = json.loads(lines[-1])
    if java_metadata.get("tool") != "JPEXS 26.2.1":
        raise SystemExit(f"Unexpected Java exporter metadata: {java_metadata}")
    write_json(CACHE / "run-state.json", {
        **run_state, "status": "rendered", "returnCode": 0,
        "renderedUnix": time.time(),
    })
    try:
        normalize_exports(raw, staging, java_metadata)
        validation = validate(staging)
        write_json(staging / "manifest.json", manifest(source_hash))
        contact_sheets = build_contact_sheets(staging)
        ending_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        if ending_hash != source_hash:
            raise SystemExit("Original play.swf changed during export")

        export_metadata = {
            **java_metadata,
            **validation,
            "sourceSha256Before": source_hash,
            "sourceSha256After": ending_hash,
            "driverCommand": driver_command,
            "command": command,
            "javaPid": process.pid,
            "contactSheets": [str(path.relative_to(ROOT)) for path in contact_sheets],
        }
        write_json(CACHE / "export-metadata.json", export_metadata)
        (CACHE / "task-1-report.md").write_text(
            report(source_hash, process.pid, driver_command, command, contact_sheets)
        )

        destination = ROOT / "public/modern/assets/world"
        if destination.exists():
            shutil.rmtree(destination)
        shutil.copytree(staging, destination)
        write_json(CACHE / "run-state.json", {
            **run_state, "status": "complete", "returnCode": 0,
            "finishedUnix": time.time(), "pngCount": 810,
        })
    except BaseException as error:
        write_json(CACHE / "run-state.json", {
            **run_state, "status": "failed", "returnCode": 0,
            "finishedUnix": time.time(), "error": str(error),
        })
        raise
    print(
        "Exported 21 original world clips (790 frames) and 20 neutral houses "
        f"from play.swf ({source_hash})"
    )


if __name__ == "__main__":
    main()
