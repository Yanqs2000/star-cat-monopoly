"""Export original card faces and luck illustrations as browser-only PNG assets."""

from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
JAVA_SOURCE = ROOT / "scripts/ExportInteractionAssets.java"
CARD_IDS = (1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33)
CARD_SIZE = (65, 67)
LUCK_SIZE = (400, 300)
CARD_OFFSET = (-25, -32)
LUCK_OFFSET = (0, 0)


def rgba(path: Path, expected_size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source:
        source.load()
        if source.format != "PNG" or source.mode != "RGBA" or source.size != expected_size:
            raise SystemExit(
                f"Unexpected native PNG geometry: {path} "
                f"({source.format} {source.mode} {source.size})"
            )
        if source.getchannel("A").getbbox() is None or source.getbbox() is None:
            raise SystemExit(f"PNG contains no decoded visible pixels: {path}")
        return source.copy()


def validate(staging: Path) -> dict[str, object]:
    cards = {staging / f"cards/{card_id}.png" for card_id in CARD_IDS}
    luck = {staging / f"luck/{luck_id}.png" for luck_id in range(1, 42)}
    actual = set(staging.rglob("*.png"))
    if actual != cards | luck:
        raise SystemExit("Exporter must produce exactly 17 canonical card and 41 canonical luck PNGs")

    card_alpha_extrema = set()
    luck_alpha_extrema = set()
    for path in sorted(cards):
        card_alpha_extrema.add(rgba(path, CARD_SIZE).getchannel("A").getextrema())
    for path in sorted(luck):
        luck_alpha_extrema.add(rgba(path, LUCK_SIZE).getchannel("A").getextrema())
    return {
        "decodedPngCounts": {"cards": len(cards), "luck": len(luck)},
        "cardAlphaExtrema": [list(value) for value in sorted(card_alpha_extrema)],
        "luckAlphaExtrema": [list(value) for value in sorted(luck_alpha_extrema)],
    }


def build_card_contact_sheet(staging: Path, target: Path) -> None:
    columns, rows = 6, 3
    margin, label_height, cell_width, cell_height = 18, 24, 84, 98
    sheet = Image.new(
        "RGB",
        (margin * 2 + columns * cell_width, margin * 2 + rows * cell_height),
        (32, 35, 41),
    )
    draw = ImageDraw.Draw(sheet)
    for index, card_id in enumerate(CARD_IDS):
        x = margin + index % columns * cell_width
        y = margin + index // columns * cell_height
        image = rgba(staging / f"cards/{card_id}.png", CARD_SIZE)
        sheet.paste(image, (x + 9, y + label_height), image)
        draw.text((x + 7, y + 4), f"card {card_id}", fill=(245, 245, 245))
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)


def build_luck_contact_sheet(staging: Path, target: Path) -> None:
    columns, rows = 5, 9
    margin, label_height, cell_width, cell_height = 18, 24, 216, 182
    sheet = Image.new(
        "RGB",
        (margin * 2 + columns * cell_width, margin * 2 + rows * cell_height),
        (32, 35, 41),
    )
    draw = ImageDraw.Draw(sheet)
    for index, luck_id in enumerate(range(1, 42)):
        x = margin + index % columns * cell_width
        y = margin + index // columns * cell_height
        image = rgba(staging / f"luck/{luck_id}.png", LUCK_SIZE)
        preview = image.resize((200, 150), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + 8, y + label_height), preview)
        draw.text((x + 8, y + 4), f"luck {luck_id}", fill=(245, 245, 245))
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

    cache = ROOT / ".analysis-cache/interaction-assets"
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
    expected_metadata = {
        "tool": "JPEXS 26.2.1",
        "cardSpriteId": 1721,
        "cardFrameCount": 40,
        "cardBoundsTwips": [-500, 797, -640, 700],
        "luckSpriteId": 1412,
        "luckFrameCount": 60,
        "luckBoundsTwips": [0, 8000, 0, 6000],
    }
    if java_metadata != expected_metadata:
        raise SystemExit(f"Unexpected JPEXS source metadata: {java_metadata}")

    validation = validate(staging)
    manifest = {
        "version": 1,
        "sourceSha256": source_hash,
        "cards": [
            {
                "id": card_id,
                "sourceFrame": card_id + 1,
                "url": f"assets/interactions/cards/{card_id}.png",
                "width": CARD_SIZE[0],
                "height": CARD_SIZE[1],
                "offsetX": CARD_OFFSET[0],
                "offsetY": CARD_OFFSET[1],
            }
            for card_id in CARD_IDS
        ],
        "luck": [
            {
                "id": luck_id,
                "sourceFrame": luck_id,
                "url": f"assets/interactions/luck/{luck_id}.png",
                "width": LUCK_SIZE[0],
                "height": LUCK_SIZE[1],
                "offsetX": LUCK_OFFSET[0],
                "offsetY": LUCK_OFFSET[1],
            }
            for luck_id in range(1, 42)
        ],
    }
    (staging / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )

    card_contact_sheet = cache / "cards-contact-sheet.png"
    luck_contact_sheet = cache / "luck-contact-sheet.png"
    build_card_contact_sheet(staging, card_contact_sheet)
    build_luck_contact_sheet(staging, luck_contact_sheet)
    ending_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    if ending_hash != source_hash:
        raise SystemExit("Original play.swf changed during export")

    metadata = {
        **java_metadata,
        **validation,
        "sourceSha256Before": source_hash,
        "sourceSha256After": ending_hash,
        "cardOffset": list(CARD_OFFSET),
        "luckOffset": list(LUCK_OFFSET),
        "pngCounts": {"cards": 17, "luck": 41},
        "command": command,
        "contactSheets": [
            str(card_contact_sheet.relative_to(ROOT)),
            str(luck_contact_sheet.relative_to(ROOT)),
        ],
    }
    (cache / "export-metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"
    )
    (cache / "export.log").write_text(result.stdout + result.stderr)

    destination = ROOT / "public/modern/assets/interactions"
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(staging, destination)
    print(
        "Exported 17 original card faces and 41 luck illustrations "
        f"from play.swf ({source_hash})"
    )


if __name__ == "__main__":
    main()
