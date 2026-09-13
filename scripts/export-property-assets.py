"""Export original property signs and frozen-owner house frames as PNG/JSON.

The browser consumes only the generated PNGs and manifest. JPEXS, Java and the
original SWF are offline inputs, and the source SWF is opened read-only.
"""

from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
JAVA_SOURCE = ROOT / "scripts/ExportPropertyAssets.java"
BRAND_BOUNDS = (-8, 1152, -515, 745)
HOUSE_BOUNDS = (-360, 1440, -1373, 1107)
BRAND_SIZE = (58, 63)
HOUSE_SIZE = (90, 124)


def rgba(path: Path, expected_size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source:
        source.load()
        if source.mode != "RGBA" or source.size != expected_size:
            raise SystemExit(f"Unexpected RGBA dimensions: {path} ({source.mode} {source.size})")
        alpha = source.getchannel("A")
        if alpha.getextrema() != (0, 255) or source.getbbox() is None:
            raise SystemExit(f"Missing opaque/transparent geometry: {path}")
        return source.copy()


def representative_color(image: Image.Image) -> tuple[int, int, int]:
    opaque = [pixel[:3] for pixel in image.get_flattened_data() if pixel[3] == 255]
    return max(opaque, key=lambda rgb: (max(rgb) - min(rgb), sum(rgb)))


def validate(staging: Path) -> dict[str, object]:
    signs = [staging / f"sell-sign/facing-{facing}.png" for facing in range(1, 5)]
    houses = {
        (owner, facing, level): staging
        / f"houses/owner-{owner}/facing-{facing}/level-{level}.png"
        for owner in range(1, 5)
        for facing in range(1, 5)
        for level in range(6)
    }
    actual = list(staging.rglob("*.png"))
    if len(actual) != 100 or set(actual) != set(signs) | set(houses.values()):
        raise SystemExit("Exporter must produce exactly 4 sign and 96 house PNGs")

    for path in signs:
        rgba(path, BRAND_SIZE)

    owner_colors: dict[str, list[int]] = {}
    for facing in range(1, 5):
        for level in range(6):
            images = [rgba(houses[(owner, facing, level)], HOUSE_SIZE) for owner in range(1, 5)]
            alpha = images[0].getchannel("A")
            if any(ImageChops.difference(alpha, image.getchannel("A")).getbbox() for image in images[1:]):
                raise SystemExit(f"Owner variants changed house alpha geometry: facing {facing}, level {level}")
            for left in range(4):
                for right in range(left + 1, 4):
                    difference = ImageChops.difference(images[left].convert("RGB"), images[right].convert("RGB"))
                    if difference.getbbox() is None:
                        raise SystemExit(
                            f"Owner colors are identical: owners {left + 1}/{right + 1}, "
                            f"facing {facing}, level {level}"
                        )
            if facing == 1 and level == 0:
                owner_colors = {
                    str(owner): list(representative_color(image))
                    for owner, image in enumerate(images, start=1)
                }
    return {"ownerGrade0RepresentativeRgb": owner_colors}


def build_contact_sheet(staging: Path, target: Path) -> None:
    margin, label_height, cell_width, cell_height = 18, 36, 94, 132
    width = margin * 2 + cell_width * 24
    height = margin * 2 + label_height + cell_height * 4
    sheet = Image.new("RGB", (width, height), (35, 38, 44))
    draw = ImageDraw.Draw(sheet)
    for facing in range(1, 5):
        x = margin + (facing - 1) * 6 * cell_width
        draw.text((x + 4, margin + 4), f"facing {facing} / levels 0-5", fill=(235, 235, 235))
    for owner in range(1, 5):
        y = margin + label_height + (owner - 1) * cell_height
        draw.text((3, y + 4), str(owner), fill=(255, 255, 255))
        for facing in range(1, 5):
            for level in range(6):
                x = margin + ((facing - 1) * 6 + level) * cell_width
                image = rgba(
                    staging / f"houses/owner-{owner}/facing-{facing}/level-{level}.png",
                    HOUSE_SIZE,
                )
                sheet.paste(image, (x + 2, y + 4), image)
                draw.text((x + 4, y + 115), f"L{level}", fill=(245, 245, 245))
                if level == 5:
                    draw.rectangle((x, y + 1, x + cell_width - 2, y + cell_height - 2), outline=(255, 84, 84), width=2)
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)


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

    cache = ROOT / ".analysis-cache/property-assets"
    staging = cache / "staging"
    java_scratch = cache / "java"
    if staging.exists():
        shutil.rmtree(staging)
    if java_scratch.exists():
        shutil.rmtree(java_scratch)
    command = [
        java,
        "-Xmx2g",
        "-Djava.awt.headless=true",
        "--class-path",
        str(jar),
        str(JAVA_SOURCE),
        str(source),
        str(staging),
        str(java_scratch),
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    lines = [line for line in result.stdout.splitlines() if line.strip()]
    if not lines:
        raise SystemExit("Java exporter did not return metadata")
    java_metadata = json.loads(lines[-1])
    if java_metadata.get("ownerShapeIds") != [3140, 3142, 3144, 3146]:
        raise SystemExit("Unexpected owner marker source shapes")

    validation = validate(staging)
    manifest = {
        "version": 1,
        "sourceSha256": source_hash,
        "sellSigns": [
            {
                "facing": facing,
                "url": f"assets/properties/sell-sign/facing-{facing}.png",
                "offsetX": BRAND_BOUNDS[0] / 20,
                "offsetY": BRAND_BOUNDS[2] / 20,
            }
            for facing in range(1, 5)
        ],
        "houses": [
            {
                "ownerId": owner,
                "facing": facing,
                "level": level,
                "url": (
                    f"assets/properties/houses/owner-{owner}/"
                    f"facing-{facing}/level-{level}.png"
                ),
                "offsetX": HOUSE_BOUNDS[0] / 20,
                "offsetY": HOUSE_BOUNDS[2] / 20,
            }
            for owner in range(1, 5)
            for facing in range(1, 5)
            for level in range(6)
        ],
    }
    (staging / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )

    contact_sheet = cache / "contact-sheet.png"
    build_contact_sheet(staging, contact_sheet)
    metadata = {
        **java_metadata,
        **validation,
        "sourceSha256": source_hash,
        "signOffset": [BRAND_BOUNDS[0] / 20, BRAND_BOUNDS[2] / 20],
        "houseOffset": [HOUSE_BOUNDS[0] / 20, HOUSE_BOUNDS[2] / 20],
        "pngCounts": {"sellSigns": 4, "houses": 96},
        "command": command,
        "contactSheet": str(contact_sheet.relative_to(ROOT)),
    }
    (cache / "export-metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"
    )
    (cache / "export.log").write_text(result.stdout + result.stderr)

    destination = ROOT / "public/modern/assets/properties"
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(staging, destination)
    print(
        "Exported 4 original property signs and 96 frozen-owner house frames "
        f"from play.swf ({source_hash})"
    )


if __name__ == "__main__":
    main()
