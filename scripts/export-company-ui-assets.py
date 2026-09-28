"""Export the original company dialog artwork without saving or changing the SWF."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = "790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba"

def main():
    source = ROOT / "public/original/play.swf"
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise SystemExit("Original play.swf hash mismatch")
    jar = Path(os.environ.get("FFDEC_JAR", ROOT.parents[1] / ".analysis-tools/ffdec-26.2.1/ffdec.jar"))
    java = os.environ.get("FFDEC_JAVA", "/opt/homebrew/opt/openjdk/bin/java")
    version = subprocess.run([java, "-jar", str(jar), "-help"], check=True, capture_output=True, text=True).stdout
    if "v.26.2.1" not in version:
        raise SystemExit("Expected JPEXS 26.2.1")
    destination = ROOT / "public/modern/assets/companies/dialog.png"
    cache = ROOT / ".analysis-cache/3b-company-ui/frozen"
    cache.mkdir(parents=True, exist_ok=True)
    subprocess.run([java, "-Djava.awt.headless=true", "--class-path", str(jar),
                    str(ROOT / "scripts/ExportCompanyUiAssets.java"), str(source),
                    str(destination), str(cache)], check=True)
    with Image.open(destination) as image:
        if image.mode != "RGBA" or image.size != (408, 356) or image.getchannel("A").getextrema() != (0, 255):
            raise SystemExit(f"Unexpected original dialog artwork: {image.mode} {image.size}")
    manifest = {"version": 1, "sourceSha256": SOURCE_SHA, "sourceSpriteId": 1515,
                "sourceFrame": 20, "retainedDepths": [1, 3], "sourceSymbols": [1510, 1512],
                "boundsTwips": [-3960, 3960, -3480, 3400], "width": 408, "height": 356,
                "rasterFilterPadding": 6, "offsetX": -204, "offsetY": -180,
                "url": "assets/companies/dialog.png"}
    destination.with_suffix(".json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("Exported original company dialog artwork: 408x356 including native filter padding")

if __name__ == "__main__":
    main()
