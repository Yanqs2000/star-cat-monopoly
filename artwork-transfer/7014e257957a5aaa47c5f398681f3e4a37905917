"""Export the twelve original gufen buildings without changing the source SWF."""

from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = "790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba"
# Symbol ids and source twip bounds verified against the hash-locked play.swf.
COMPANIES = [
    (186, -1780, 1780, -2540, 1280),
    (180, -1800, 1800, -2460, 1300),
    (213, -2090, 2170, -2200, 1520),
    (183, -2210, 2050, -2600, 1540),
    (189, -2010, 2010, -2820, 1520),
    (192, -1780, 1860, -2020, 1440),
    (204, -2080, 1960, -2280, 1560),
    (198, -2100, 2100, -2180, 1480),
    (195, -2260, 2260, -1560, 1660),
    (201, -2120, 2120, -1840, 1560),
    (207, -2090, 2130, -2580, 1520),
    (210, -2080, 2080, -2060, 1540),
]
PLACEMENTS = [(1988, 251, 124), (1765, 1395, 127), (305, 1479, 130), (530, 330, 133)]


def main() -> None:
    source = ROOT / "public/original/play.swf"
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    manifest = json.loads((ROOT / "public/original/manifest.json").read_text())
    declared = next(item["sha256"] for item in manifest["files"] if item["name"] == "play.swf")
    if digest != SOURCE_SHA or digest != declared:
        raise SystemExit("Original play.swf hash mismatch")

    jar = Path(os.environ.get("FFDEC_JAR", ROOT.parents[1] / ".analysis-tools/ffdec-26.2.1/ffdec.jar"))
    java = os.environ.get("FFDEC_JAVA", "/opt/homebrew/opt/openjdk/bin/java")
    version = subprocess.run([java, "-jar", str(jar), "-help"], check=True,
                             capture_output=True, text=True).stdout
    if "v.26.2.1" not in version:
        raise SystemExit("Expected JPEXS 26.2.1")

    cache = ROOT / ".analysis-cache/3b-company-assets"
    raw = cache / "export"
    if raw.exists():
        shutil.rmtree(raw)
    ids = ",".join(str(item[0]) for item in COMPANIES)
    command = [java, "-Xmx2g", "-Djava.awt.headless=true", "-jar", str(jar),
               "-selectid", ids, "-format", "sprite:png", "-export", "sprite", str(raw), str(source)]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    destination = ROOT / "public/modern/assets/companies"
    destination.mkdir(parents=True, exist_ok=True)
    images = []
    company_manifest = []
    for character_id, (symbol_id, x_min, x_max, y_min, y_max) in enumerate(COMPANIES, start=1):
        matches = list(raw.glob(f"DefineSprite_{symbol_id}_gufen{character_id}/1.png"))
        if len(matches) != 1:
            raise SystemExit(f"Expected one frame for gufen{character_id}")
        expected = ((x_max - x_min) // 20, (y_max - y_min) // 20)
        with Image.open(matches[0]) as source_image:
            source_image.load()
            if source_image.mode != "RGBA" or source_image.size != expected or \
                    source_image.getchannel("A").getextrema() != (0, 255):
                raise SystemExit(f"Invalid original company image {character_id}")
            images.append(source_image.copy())
        shutil.copyfile(matches[0], destination / f"{character_id}.png")
        company_manifest.append({
            "characterId": character_id,
            "sourceSpriteId": symbol_id,
            "url": f"assets/companies/{character_id}.png",
            "width": expected[0], "height": expected[1],
            "offsetX": x_min / 20, "offsetY": y_min / 20,
            "boundsTwips": [x_min, x_max, y_min, y_max],
        })
    if len(list(raw.glob("*/1.png"))) != 12:
        raise SystemExit("Unexpected company sprite count")

    data = {"version": 1, "sourceSha256": digest, "companies": company_manifest,
            "placements": [
                {"hometown": index, "x": x, "y": y, "mainRecordId": record_id}
                for index, (x, y, record_id) in enumerate(PLACEMENTS, start=1)
            ]}
    (destination / "manifest.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    sheet = Image.new("RGB", (1040, 780), (49, 61, 72))
    draw = ImageDraw.Draw(sheet)
    for index, image in enumerate(images):
        x = (index % 4) * 260 + 18
        y = (index // 4) * 260 + 20
        sheet.paste(image, (x, y), image)
        draw.text((x, y + 225), f"gufen{index + 1}", fill="white")
    sheet.save(cache / "contact-sheet.png")
    (cache / "export.log").write_text(result.stdout + result.stderr)
    print(f"Exported {len(company_manifest)} original company sprites from {digest}")


if __name__ == "__main__":
    main()
