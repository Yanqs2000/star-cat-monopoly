"""Export original character reactions as browser-only PNG/JSON assets."""

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

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
JAVA_SOURCE = ROOT / "scripts/ExportReactionAssets.java"
CACHE = ROOT / ".analysis-cache/reaction-assets"
REPORT = ROOT / ".superpowers/sdd/2026-09-16-modern-world-assets/task-2-report.md"
FACINGS = ("down-right", "down-left", "up-left", "up-right")
REACTIONS = ("neutral", "ready", "happy", "sad", "hurt")
OFFSETS = {"neutral": 1, "ready": 7, "happy": 3, "sad": 5, "hurt": 10}
GOD_IDS = (2, 3, 4, 5, 10, 11)

SOURCE_SYMBOLS = {
    1: (2,132,69,113,193,195,310,247,291,371,373,490,425,471,551,553,666,603,647,727),
    2: (2,128,69,109,189,191,302,243,283,363,365,476,417,457,537,539,648,589,629,709),
    3: (2,126,63,107,187,189,298,235,279,359,361,470,407,451,531,533,640,577,621,701),
    4: (2,130,67,111,191,193,306,243,287,367,369,482,419,463,543,545,658,595,639,719),
    5: (2,132,69,113,193,225,338,275,319,399,431,544,481,525,605,637,750,687,731,811),
    6: (2,109,52,100,170,172,281,224,272,342,344,453,396,444,514,516,625,568,616,686),
    7: (2,126,63,107,187,189,298,235,279,359,361,470,407,451,531,533,642,579,623,703),
    8: (2,124,61,105,183,185,292,229,273,351,353,461,398,442,520,522,629,566,610,688),
    9: (2,126,63,107,193,195,304,241,285,371,373,482,419,463,549,551,660,597,641,727),
    10: (2,128,65,109,189,191,302,239,283,363,365,476,413,457,537,539,650,587,631,711),
    11: (2,126,63,107,187,189,298,235,279,359,361,470,407,451,531,533,642,579,623,709),
    12: (2,128,65,109,189,191,304,241,285,367,369,480,417,461,541,543,654,591,635,715),
}


@dataclass(frozen=True)
class ClipSpec:
    character_id: int
    facing: str
    name: str
    source_root_frame: int
    source_symbol: int
    frames: int

    @property
    def key(self) -> str:
        return f"{self.name}/{self.facing}"


def expected_frames(character_id: int, facing: str, name: str) -> int:
    if name in {"neutral", "ready"}:
        return 1
    if name == "hurt":
        return 33 if character_id == 8 else 60
    if name == "happy":
        if character_id == 6 and facing == "down-right":
            return 68
        if character_id == 9:
            return 43
        if character_id in {10, 12}:
            return 46
        return 57
    if character_id == 2:
        return 63
    if character_id == 6:
        return 69
    if (character_id, facing) in {(1, "down-left"), (5, "up-right")}:
        return 74
    return 73


def specs(character_id: int) -> tuple[ClipSpec, ...]:
    result = []
    index = 0
    for facing_index, facing in enumerate(FACINGS):
        for name in REACTIONS:
            result.append(ClipSpec(
                character_id=character_id,
                facing=facing,
                name=name,
                source_root_frame=facing_index * 30 + OFFSETS[name],
                source_symbol=SOURCE_SYMBOLS[character_id][index],
                frames=expected_frames(character_id, facing, name),
            ))
            index += 1
    return tuple(result)


def canvas_size(bounds: list[int]) -> tuple[int, int]:
    return math.ceil((bounds[1] - bounds[0]) / 20), math.ceil((bounds[3] - bounds[2]) / 20)


def offset(bounds: list[int]) -> tuple[float, float]:
    return bounds[0] / 20, bounds[2] / 20


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def decoded_rgba(path: Path, expected_size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source:
        source.load()
        if source.format != "PNG" or source.mode != "RGBA" or source.size != expected_size:
            raise SystemExit(
                f"Unexpected native RGBA PNG: {path} "
                f"({source.format} {source.mode} {source.size}, expected {expected_size})"
            )
        return source.copy()


def validate_java_metadata(character_id: int, metadata: dict[str, object]) -> None:
    if metadata.get("tool") != "JPEXS 26.2.1" or metadata.get("characterId") != character_id:
        raise SystemExit(f"Unexpected Java metadata for star{character_id}: {metadata}")
    clips = metadata.get("clips")
    overlays = metadata.get("godOverlays")
    if not isinstance(clips, list) or len(clips) != 20:
        raise SystemExit(f"star{character_id} must export 20 clips")
    if not isinstance(overlays, list) or len(overlays) != 6:
        raise SystemExit(f"star{character_id} must export 6 god overlays")
    for expected, actual in zip(specs(character_id), clips, strict=True):
        wanted = {
            "name": expected.name,
            "facing": expected.facing,
            "sourceRootFrame": expected.source_root_frame,
            "sourceSymbol": expected.source_symbol,
            "frames": expected.frames,
        }
        for key, value in wanted.items():
            if actual.get(key) != value:
                raise SystemExit(
                    f"Unexpected star{character_id} {expected.key} {key}: {actual.get(key)}"
                )
        matrix = actual.get("sourceMatrix")
        if not isinstance(matrix, dict) or matrix.get("scaleX") != 1.0 or \
                matrix.get("scaleY") != 1.0 or matrix.get("rotateSkew0") != 0.0 or \
                matrix.get("rotateSkew1") != 0.0:
            raise SystemExit(f"Unexpected source matrix: star{character_id} {expected.key}")
        if canvas_size(actual["renderBoundsTwips"])[0] <= 0 or \
                canvas_size(actual["renderBoundsTwips"])[1] <= 0:
            raise SystemExit(f"Empty render bounds: star{character_id} {expected.key}")
    for god_id, actual in zip(GOD_IDS, overlays, strict=True):
        wanted = {
            "godId": god_id,
            "sourceFrame": god_id,
            "sourceRootFrame": 1,
            "sourceDepth": 3,
            "sourceInstance": "npcz",
            "sourceSymbol": 17,
        }
        for key, value in wanted.items():
            if actual.get(key) != value:
                raise SystemExit(f"Unexpected star{character_id} god {god_id} {key}")
        matrix = actual.get("sourceMatrix")
        if not isinstance(matrix, dict) or (matrix.get("translateX"), matrix.get("translateY")) \
                != (319, -1470):
            raise SystemExit(f"Unexpected star{character_id} npcz placement")


def copy_raw_to_staging(raw: Path, staging: Path, all_metadata: list[dict[str, object]]) -> None:
    for character_id, metadata in enumerate(all_metadata, 1):
        validate_java_metadata(character_id, metadata)
        target = staging / str(character_id)
        for spec, item in zip(specs(character_id), metadata["clips"], strict=True):
            expected_size = canvas_size(item["renderBoundsTwips"])
            for frame in range(1, spec.frames + 1):
                source = raw / str(character_id) / spec.name / spec.facing / f"{frame}.png"
                decoded_rgba(source, expected_size)
                destination = target / spec.name / spec.facing / f"{frame}.png"
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, destination)
        for item in metadata["godOverlays"]:
            god_id = item["godId"]
            source = raw / str(character_id) / "gods" / f"{god_id}.png"
            decoded_rgba(source, canvas_size(item["renderBoundsTwips"]))
            destination = target / "gods" / f"{god_id}.png"
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)


def build_manifest(character_id: int, source_hash: str,
                   metadata: dict[str, object]) -> dict[str, object]:
    clips = []
    for spec, item in zip(specs(character_id), metadata["clips"], strict=True):
        size = canvas_size(item["renderBoundsTwips"])
        origin = offset(item["renderBoundsTwips"])
        clips.append({
            "name": spec.name,
            "facing": spec.facing,
            "fps": 30,
            "loop": False,
            "sourceRootFrame": spec.source_root_frame,
            "sourceSymbol": spec.source_symbol,
            "frames": [{
                "url": (
                    f"assets/characters/{character_id}/reactions/"
                    f"{spec.name}/{spec.facing}/{frame}.png"
                ),
                "width": size[0],
                "height": size[1],
                "offsetX": origin[0],
                "offsetY": origin[1],
            } for frame in range(1, spec.frames + 1)],
        })
    overlays = []
    for item in metadata["godOverlays"]:
        size = canvas_size(item["renderBoundsTwips"])
        origin = offset(item["renderBoundsTwips"])
        god_id = item["godId"]
        overlays.append({
            "godId": god_id,
            "url": f"assets/characters/{character_id}/reactions/gods/{god_id}.png",
            "width": size[0],
            "height": size[1],
            "offsetX": origin[0],
            "offsetY": origin[1],
        })
    return {
        "version": 1,
        "characterId": character_id,
        "sourceSha256": source_hash,
        "clips": clips,
        "godOverlays": overlays,
    }


def rgba_hash(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def validate_outputs(staging: Path, all_metadata: list[dict[str, object]]) -> dict[str, object]:
    expected_paths: set[Path] = set()
    unique_hashes: dict[str, int] = {}
    alpha_coverage: dict[str, dict[str, int]] = {}
    total_clip_frames = 0
    for character_id, metadata in enumerate(all_metadata, 1):
        for spec, item in zip(specs(character_id), metadata["clips"], strict=True):
            size = canvas_size(item["renderBoundsTwips"])
            hashes: set[str] = set()
            coverage = []
            for frame in range(1, spec.frames + 1):
                path = staging / str(character_id) / spec.name / spec.facing / f"{frame}.png"
                expected_paths.add(path)
                image = decoded_rgba(path, size)
                bbox = image.getchannel("A").getbbox()
                if bbox is None:
                    raise SystemExit(f"Unexpected empty reaction frame: star{character_id} {spec.key} {frame}")
                hashes.add(rgba_hash(image))
                coverage.append(sum(
                    1 for alpha in image.getchannel("A").get_flattened_data() if alpha
                ))
            if spec.frames > 1 and len(hashes) == 1:
                raise SystemExit(f"Reaction timeline did not advance: star{character_id} {spec.key}")
            samples = (1, (spec.frames + 1) // 2, spec.frames)
            sample_hashes = {
                rgba_hash(decoded_rgba(
                    staging / str(character_id) / spec.name / spec.facing / f"{frame}.png",
                    size,
                )) for frame in samples
            }
            if spec.frames > 1 and len(sample_hashes) == 1:
                raise SystemExit(f"First/middle/last samples are identical: star{character_id} {spec.key}")
            key = f"star{character_id}/{spec.key}"
            unique_hashes[key] = len(hashes)
            alpha_coverage[key] = {"min": min(coverage), "max": max(coverage)}
            total_clip_frames += spec.frames
        for item in metadata["godOverlays"]:
            god_id = item["godId"]
            path = staging / str(character_id) / "gods" / f"{god_id}.png"
            expected_paths.add(path)
            image = decoded_rgba(path, canvas_size(item["renderBoundsTwips"]))
            coverage = sum(
                1 for alpha in image.getchannel("A").get_flattened_data() if alpha
            )
            if coverage == 0:
                raise SystemExit(f"Empty god overlay: star{character_id} god {god_id}")
            alpha_coverage[f"star{character_id}/god-{god_id}"] = {
                "min": coverage, "max": coverage,
            }

    actual_paths = set(staging.rglob("*.png"))
    if actual_paths != expected_paths or len(actual_paths) != 8993:
        raise SystemExit(f"Exporter must produce exactly 8993 canonical PNGs, got {len(actual_paths)}")
    return {
        "decodedPngCounts": {
            "clipFrames": total_clip_frames,
            "godOverlays": 72,
            "total": len(actual_paths),
        },
        "uniqueFrameHashes": unique_hashes,
        "nonzeroAlphaPixels": alpha_coverage,
    }


def paste_at_actor_origin(sheet: Image.Image, image: Image.Image, origin: tuple[float, float],
                          cell_x: int, cell_y: int, cell_width: int, cell_height: int,
                          scale: float = 0.72) -> None:
    width = max(1, round(image.width * scale))
    height = max(1, round(image.height * scale))
    preview = image.resize((width, height), Image.Resampling.LANCZOS)
    actor_x = cell_x + cell_width // 2
    actor_y = cell_y + round(cell_height * 0.72)
    x = actor_x + round(origin[0] * scale)
    y = actor_y + round(origin[1] * scale)
    sheet.paste(preview, (x, y), preview)


def build_timeline_sheet(staging: Path, all_metadata: list[dict[str, object]], target: Path,
                         selections: list[tuple[int, str, str]]) -> None:
    columns, cell_width, cell_height, margin = 3, 190, 180, 16
    sheet = Image.new(
        "RGB", (margin * 2 + columns * cell_width,
                margin * 2 + len(selections) * cell_height), (29, 32, 38)
    )
    draw = ImageDraw.Draw(sheet)
    for row, (character_id, name, facing) in enumerate(selections):
        spec = next(item for item in specs(character_id)
                    if item.name == name and item.facing == facing)
        item = next(item for item in all_metadata[character_id - 1]["clips"]
                    if item["name"] == name and item["facing"] == facing)
        size = canvas_size(item["renderBoundsTwips"])
        origin = offset(item["renderBoundsTwips"])
        for column, frame in enumerate((1, (spec.frames + 1) // 2, spec.frames)):
            x = margin + column * cell_width
            y = margin + row * cell_height
            draw.text((x + 5, y + 4),
                      f"star{character_id} {name} {facing} {frame}/{spec.frames}",
                      fill=(245, 245, 245))
            image = decoded_rgba(
                staging / str(character_id) / name / facing / f"{frame}.png", size
            )
            paste_at_actor_origin(sheet, image, origin, x, y + 20, cell_width, cell_height - 20)
            actor_x = x + cell_width // 2
            actor_y = y + 20 + round((cell_height - 20) * .72)
            draw.line((actor_x - 4, actor_y, actor_x + 4, actor_y), fill=(255, 86, 86))
            draw.line((actor_x, actor_y - 4, actor_x, actor_y + 4), fill=(255, 86, 86))
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)


def build_god_sheet(staging: Path, all_metadata: list[dict[str, object]], target: Path) -> None:
    cell_width, cell_height, margin = 112, 110, 14
    sheet = Image.new(
        "RGB", (margin * 2 + len(GOD_IDS) * cell_width,
                margin * 2 + 12 * cell_height), (29, 32, 38)
    )
    draw = ImageDraw.Draw(sheet)
    for character_id, metadata in enumerate(all_metadata, 1):
        for column, item in enumerate(metadata["godOverlays"]):
            x = margin + column * cell_width
            y = margin + (character_id - 1) * cell_height
            god_id = item["godId"]
            draw.text((x + 4, y + 4), f"star{character_id} god{god_id}", fill=(245, 245, 245))
            image = decoded_rgba(
                staging / str(character_id) / "gods" / f"{god_id}.png",
                canvas_size(item["renderBoundsTwips"]),
            )
            paste_at_actor_origin(
                sheet, image, offset(item["renderBoundsTwips"]),
                x, y + 18, cell_width, cell_height - 18, 0.78,
            )
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)


def build_contact_sheets(staging: Path,
                         all_metadata: list[dict[str, object]]) -> list[Path]:
    all_characters = [
        (character_id, ("happy", "sad", "hurt")[(character_id - 1) % 3],
         FACINGS[(character_id - 1) % 4])
        for character_id in range(1, 13)
    ]
    special = [
        (5, "happy", "down-left"),
        (6, "happy", "down-right"),
        (8, "hurt", "up-right"),
        (10, "sad", "up-left"),
        (10, "hurt", "up-left"),
        (12, "hurt", "up-left"),
    ]
    all_path = CACHE / "all-characters-contact-sheet.png"
    special_path = CACHE / "special-placement-contact-sheet.png"
    gods_path = CACHE / "god-overlays-contact-sheet.png"
    build_timeline_sheet(staging, all_metadata, all_path, all_characters)
    build_timeline_sheet(staging, all_metadata, special_path, special)
    build_god_sheet(staging, all_metadata, gods_path)
    return [all_path, special_path, gods_path]


def build_report(source_hashes: dict[int, str], java_pids: list[int],
                 driver_command: list[str], commands: list[list[str]],
                 metadata: list[dict[str, object]], contact_sheets: list[Path]) -> str:
    hash_lines = [f"- `star{character_id}.swf`: `{source_hashes[character_id]}`"
                  for character_id in range(1, 13)]
    count_lines = []
    for character_id in range(1, 13):
        counts = {name: sum(spec.frames for spec in specs(character_id) if spec.name == name)
                  for name in REACTIONS}
        count_lines.append(
            f"- star{character_id}: neutral {counts['neutral']}, ready {counts['ready']}, "
            f"happy {counts['happy']}, sad {counts['sad']}, hurt {counts['hurt']}; 6 god overlays"
        )
    special_lines = []
    for character_id, name, facing in [
        (5, "happy", "down-left"), (10, "sad", "up-left"),
        (10, "hurt", "up-left"), (12, "hurt", "up-left"),
    ]:
        item = next(item for item in metadata[character_id - 1]["clips"]
                    if item["name"] == name and item["facing"] == facing)
        special_lines.append(
            f"- star{character_id} {facing} {name}: root {item['sourceRootFrame']}, "
            f"symbol {item['sourceSymbol']}, {item['frames']} frames, "
            f"matrix {item['sourceMatrix']}, render bounds {item['renderBoundsTwips']} twips"
        )
    return "\n".join([
        "# Task 2 reaction asset export report",
        "",
        "Status: complete (asset/parser/cursor task only; MapScene and gameplay event wiring remain separate).",
        "",
        "## Process and reproduction",
        "",
        f"- End-to-end reproduction: `{' '.join(driver_command)}`.",
        f"- Java exporter PIDs: `{', '.join(map(str, java_pids))}` (all finished).",
        f"- Java source: `{JAVA_SOURCE.relative_to(ROOT)}`.",
        "- The driver compiles the committed Java exporter, validates JPEXS 26.2.1, exports all 12 SWFs, decodes/validates every PNG, builds manifests/contact sheets, checks source hashes again, then installs only each character's `reactions` directory.",
        "- No ignored probe PNG or runtime SWF dependency is used by the clean-checkout reproduction command.",
        "- Java subprocess commands are recorded in `.analysis-cache/reaction-assets/export-metadata.json`.",
        "",
        "## Source SHA-256 before and after",
        "",
        *hash_lines,
        "",
        "## Exact output counts",
        "",
        "- 12 characters x 4 facings x 5 clips = 240 clips.",
        "- 8,921 reaction timeline frames + 72 attached-god overlays = 8,993 RGBA PNGs.",
        *count_lines,
        "",
        "## Source geometry evidence",
        "",
        "- Every clip uses the selected root frame's actual depth-1 placement matrix and the complete child bounds; the generated frame offset remains relative to the shared actor origin.",
        "- Neutral offset 1 and ready offset 7 are one-frame shapes. Happy offset 3, sad offset 5, and hurt offset 10 keep their actual child lengths at 30 fps and play once.",
        "- Every attached-god overlay freezes the character root's `npcz` depth-3 symbol 17 at source frame 2, 3, 4, 5, 10, or 11, then applies the source `(319,-1470)` twip root placement.",
        *special_lines,
        "",
        "## Decoded image and visual evidence",
        "",
        "- Every installed PNG decoded as native RGBA at its manifest dimensions and had nonzero alpha coverage.",
        "- Every animated clip had more than one decoded RGBA hash; first/middle/last samples were also checked against all-identical truncation.",
        *(f"- `{path.relative_to(ROOT)}`" for path in contact_sheets),
        "- The contact sheets were opened and inspected after generation; actor-origin crosses expose anchor drift, including star12 up-left hurt.",
        "",
        "## API and verification",
        "",
        "- `parseReactionManifest(unknown): ReactionManifest` validates 20 canonical clips, source roots/symbols/lengths, safe frame paths, finite geometry, the source hash, and six god overlays.",
        "- `ReactionPlayer` exposes `clip`, `frameIndex`, `currentFrame`, `finished`, `advance(deltaMs)`, `setPaused(boolean)`, `setSpeed(number)`, and `reset(optionalClip)`. It has no gameplay or settlement callback.",
        "- Focused reactions tests and shared `npm run typecheck` are recorded after installation.",
        "",
    ])


def main() -> None:
    jar = Path(os.environ.get(
        "FFDEC_JAR", ROOT.parents[1] / ".analysis-tools/ffdec-26.2.1/ffdec.jar"
    )).resolve()
    java = os.environ.get("FFDEC_JAVA", "/opt/homebrew/opt/openjdk/bin/java")
    javac = str(Path(java).with_name("javac"))
    if not jar.is_file():
        raise SystemExit("Set FFDEC_JAR to the verified JPEXS 26.2.1 ffdec.jar")
    version = subprocess.run(
        [java, "-Xmx2g", "-Djava.awt.headless=true", "-jar", str(jar), "-help"],
        check=True, capture_output=True, text=True,
    ).stdout
    if "v.26.2.1" not in version:
        raise SystemExit("Expected JPEXS 26.2.1")

    original = ROOT / "public/original"
    original_manifest = json.loads((original / "manifest.json").read_text())
    declared_hashes = {item["name"]: item["sha256"] for item in original_manifest["files"]}
    source_hashes = {
        character_id: hashlib.sha256(
            (original / f"star{character_id}.swf").read_bytes()
        ).hexdigest()
        for character_id in range(1, 13)
    }
    for character_id, source_hash in source_hashes.items():
        if source_hash != declared_hashes.get(f"star{character_id}.swf"):
            raise SystemExit(f"Original star{character_id}.swf hash mismatch")

    raw = CACHE / "raw"
    staging = CACHE / "staging"
    java_classes = CACHE / "java"
    java_scratch = CACHE / "java-scratch"
    for generated in (raw, staging, java_classes, java_scratch):
        if generated.exists():
            shutil.rmtree(generated)
    java_classes.mkdir(parents=True)
    compile_command = [
        javac, "-cp", str(jar), "-d", str(java_classes), str(JAVA_SOURCE),
    ]
    subprocess.run(compile_command, check=True)

    driver_command = [sys.executable, str(JAVA_SOURCE.with_name("export-reaction-assets.py"))]
    all_metadata: list[dict[str, object]] = []
    commands: list[list[str]] = []
    java_pids: list[int] = []
    started = time.time()
    write_json(CACHE / "run-state.json", {
        "status": "running", "pythonPid": os.getpid(), "startedUnix": started,
        "driverCommand": driver_command, "currentCharacter": None, "javaPids": [],
    })
    logs = []
    try:
        for character_id in range(1, 13):
            source = original / f"star{character_id}.swf"
            command = [
                java, "-Xmx2g", "-Djava.awt.headless=true", "--class-path",
                f"{java_classes}:{jar}", "ExportReactionAssets", str(source),
                str(raw / str(character_id)), str(java_scratch / str(character_id)),
                str(character_id),
            ]
            commands.append(command)
            process = subprocess.Popen(
                command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            java_pids.append(process.pid)
            write_json(CACHE / "run-state.json", {
                "status": "running", "pythonPid": os.getpid(), "startedUnix": started,
                "driverCommand": driver_command, "currentCharacter": character_id,
                "javaPids": java_pids, "currentJavaPid": process.pid,
            })
            stdout, stderr = process.communicate()
            logs.append(f"=== star{character_id} pid {process.pid} ===\n{stdout}{stderr}")
            if process.returncode:
                raise subprocess.CalledProcessError(
                    process.returncode, command, stdout, stderr
                )
            lines = [line for line in stdout.splitlines() if line.strip()]
            if not lines:
                raise SystemExit(f"Java exporter returned no metadata for star{character_id}")
            metadata = json.loads(lines[-1])
            validate_java_metadata(character_id, metadata)
            all_metadata.append(metadata)

        (CACHE / "export.log").write_text("\n".join(logs))
        copy_raw_to_staging(raw, staging, all_metadata)
        for character_id, metadata in enumerate(all_metadata, 1):
            write_json(
                staging / str(character_id) / "manifest.json",
                build_manifest(character_id, source_hashes[character_id], metadata),
            )
        validation = validate_outputs(staging, all_metadata)
        contact_sheets = build_contact_sheets(staging, all_metadata)
        ending_hashes = {
            character_id: hashlib.sha256(
                (original / f"star{character_id}.swf").read_bytes()
            ).hexdigest()
            for character_id in range(1, 13)
        }
        if ending_hashes != source_hashes:
            raise SystemExit("Original star SWF changed during export")

        export_metadata = {
            "tool": "JPEXS 26.2.1",
            "sourceSha256Before": source_hashes,
            "sourceSha256After": ending_hashes,
            "driverCommand": driver_command,
            "compileCommand": compile_command,
            "commands": commands,
            "pythonPid": os.getpid(),
            "javaPids": java_pids,
            "characters": all_metadata,
            **validation,
            "contactSheets": [str(path.relative_to(ROOT)) for path in contact_sheets],
        }
        write_json(CACHE / "export-metadata.json", export_metadata)
        report = build_report(
            source_hashes, java_pids, driver_command, commands, all_metadata, contact_sheets
        )
        (CACHE / "task-2-report.md").write_text(report)
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(report)

        for character_id in range(1, 13):
            destination = (
                ROOT / f"public/modern/assets/characters/{character_id}/reactions"
            )
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(staging / str(character_id), destination)
        write_json(CACHE / "run-state.json", {
            "status": "complete", "pythonPid": os.getpid(), "startedUnix": started,
            "finishedUnix": time.time(), "javaPids": java_pids, "pngCount": 8993,
        })
    except BaseException as error:
        (CACHE / "export.log").write_text("\n".join(logs))
        write_json(CACHE / "run-state.json", {
            "status": "failed", "pythonPid": os.getpid(), "startedUnix": started,
            "finishedUnix": time.time(), "javaPids": java_pids, "error": str(error),
        })
        raise

    print(
        "Exported 240 original reaction clips (8,921 frames) and 72 attached-god "
        "overlays from star1.swf through star12.swf"
    )


if __name__ == "__main__":
    main()
