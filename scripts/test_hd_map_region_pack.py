import json
import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_hd_map_region_sample import _preserve_original_sky, pack_map_region
from PIL import Image, ImageDraw


class MapRegionPackTests(unittest.TestCase):
    def test_does_not_paint_generated_sky_over_original_non_sky_geometry(self):
        original = Image.new('RGBA', (512, 512), (40, 155, 50, 255))
        generated = Image.new('RGBA', (2048, 2048), (40, 155, 50, 255))
        ImageDraw.Draw(generated).rectangle((0, 0, 2047, 511), fill=(20, 90, 255, 255))
        result = _preserve_original_sky(generated, original)
        alpha = result.getchannel('A')
        self.assertEqual(alpha.getpixel((500, 100)), 0)
        self.assertEqual(alpha.getpixel((500, 1500)), 255)

    def test_assembles_four_context_redraws_into_the_original_512_logical_map_patch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            region_root = root / 'region'
            region_root.mkdir()
            reference_root = root / 'references'
            reference_root.mkdir()
            original_map = root / 'map.png'
            Image.new('RGBA', (1152, 932), (40, 155, 50, 255)).save(original_map)
            master_tiles = []
            for row in range(2):
                for col in range(2):
                    name = f'r{row}c{col}'
                    image = Image.new('RGBA', (1152, 1152), (20 + col * 70, 80 + row * 80, 100, 255))
                    image.save(region_root / f'{name}.png')
                    (reference_root / f'{name}.png').write_bytes(b'reference geometry')
                    master_tiles.append({'tile': name, 'sourcePath': f'region/{name}.png',
                                         'logicalPosition': [640 + col * 256, 420 + row * 256],
                                         'logicalSize': [256, 256],
                                         'sourceSha256': hashlib.sha256((region_root / f'{name}.png').read_bytes()).hexdigest(),
                                         'inputReference': f'references/{name}.png',
                                         'generationResultPixels': [1152, 1152]})
            index = {'version': 1, 'status': 'unreviewed', 'method': 'imagegen map reference redraw',
                     'sourceMap': 'map.png', 'sourceMapSha256': hashlib.sha256(original_map.read_bytes()).hexdigest(),
                     'mapRect': [640, 420, 512, 512], 'gameWorldOffset': [-184, -313],
                     'logicalSize': [512, 512], 'tileGrid': [2, 2],
                     'paddingUsedForReference': 16, 'tiles': master_tiles}
            index_path = region_root / 'masters.json'
            index_path.write_text(json.dumps(index))
            output = root / 'stitched.png'
            result = pack_map_region(index_path, root, output)
            self.assertEqual(result['logicalRect'], [640, 420, 512, 512])
            self.assertEqual(result['pixelSize'], [2048, 2048])
            self.assertEqual(result['pixelDensity'], 4)
            self.assertEqual(result['status'], 'unreviewed')
            self.assertEqual(result['scenePosition'], [456, 107])
            with Image.open(output) as image:
                self.assertEqual(image.size, (2048, 2048))
                self.assertEqual(image.getpixel((80, 80)), (20, 80, 100, 255))
                self.assertEqual(image.getpixel((1024 + 80, 80)), (90, 80, 100, 255))
                self.assertEqual(image.getpixel((80, 1024 + 80)), (20, 160, 100, 255))
                self.assertEqual(image.getpixel((1024 + 80, 1024 + 80)), (90, 160, 100, 255))
                alpha = image.getchannel('A')
                self.assertEqual(alpha.getpixel((0, 1024)), 0)
                self.assertEqual(alpha.getpixel((64, 1024)), 255)
                self.assertEqual(alpha.getpixel((1024, 0)), 0)
                left = image.getpixel((1023, 400))[0]
                seam = image.getpixel((1024, 400))[0]
                right = image.getpixel((1025, 400))[0]
                self.assertAlmostEqual(seam, 55, delta=2)
                self.assertLess(abs(seam - left), abs(right - left))

    def test_rejects_tile_position_mismatch_before_assembly(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            region = root / 'region'; region.mkdir()
            references = root / 'references'; references.mkdir()
            tiles = []
            for row in range(2):
                for col in range(2):
                    name = f'r{row}c{col}'
                    image = Image.new('RGBA', (1152, 1152), (80, 100, 120, 255))
                    image.save(region / f'{name}.png')
                    (references / f'{name}.png').write_bytes(b'reference geometry')
                    tiles.append({'tile': name, 'sourcePath': f'region/{name}.png',
                                  'logicalPosition': [641 + col * 256, 420 + row * 256],
                                  'logicalSize': [256, 256],
                                  'sourceSha256': hashlib.sha256((region / f'{name}.png').read_bytes()).hexdigest(),
                                  'inputReference': f'references/{name}.png'})
            original_map = root / 'map.png'; Image.new('RGBA', (1152, 932), (40, 155, 50, 255)).save(original_map)
            manifest = {'status': 'unreviewed', 'sourceMap': 'map.png',
                        'sourceMapSha256': hashlib.sha256(original_map.read_bytes()).hexdigest(),
                        'gameWorldOffset': [-184, -313],
                        'mapRect': [640, 420, 512, 512], 'logicalSize': [512, 512],
                        'tileGrid': [2, 2], 'paddingUsedForReference': 16, 'tiles': tiles}
            path = region / 'masters.json'; path.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, 'map tile position drift'):
                pack_map_region(path, root, root / 'stitched.png')

    def test_rejects_a_changed_continuous_map_style_reference(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            region = root / 'region'; region.mkdir()
            references = root / 'references'; references.mkdir()
            original_map = root / 'map.png'
            Image.new('RGBA', (1152, 932), (40, 155, 50, 255)).save(original_map)
            tiles = []
            for row in range(2):
                for col in range(2):
                    name = f'r{row}c{col}'
                    tile_path = region / f'{name}.png'
                    Image.new('RGBA', (1152, 1152), (80, 100, 120, 255)).save(tile_path)
                    ref_path = references / f'{name}.png'; ref_path.write_bytes(b'global style reference')
                    tiles.append({'tile': name, 'sourcePath': f'region/{name}.png',
                                  'logicalPosition': [640 + col * 256, 420 + row * 256],
                                  'logicalSize': [256, 256],
                                  'sourceSha256': hashlib.sha256(tile_path.read_bytes()).hexdigest(),
                                  'inputReference': f'references/{name}.png',
                                  'inputReferenceSha256': hashlib.sha256(ref_path.read_bytes()).hexdigest()})
            manifest = {'status': 'unreviewed', 'sourceMap': 'map.png',
                        'sourceMapSha256': hashlib.sha256(original_map.read_bytes()).hexdigest(),
                        'gameWorldOffset': [-184, -313], 'mapRect': [640, 420, 512, 512],
                        'logicalSize': [512, 512], 'tileGrid': [2, 2],
                        'paddingUsedForReference': 16, 'tiles': tiles}
            manifest_path = region / 'masters.json'; manifest_path.write_text(json.dumps(manifest))
            (root / 'references/r0c0.png').write_bytes(b'changed reference')
            with self.assertRaisesRegex(ValueError, 'map tile input reference hash changed'):
                pack_map_region(manifest_path, root, root / 'stitched.png')

    def test_preserves_original_sky_by_transparenting_generated_sky_pixels(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            region = root / 'region'; region.mkdir()
            references = root / 'references'; references.mkdir()
            original_map = Image.new('RGBA', (1152, 932), (40, 155, 50, 255))
            for y in range(420, 600):
                for x in range(640, 1152):
                    original_map.putpixel((x, y), (90, 200, 255, 255))
            original_map_path = root / 'map.png'
            original_map.save(original_map_path)
            tiles = []
            for row in range(2):
                for col in range(2):
                    name = f'r{row}c{col}'
                    tile_path = region / f'{name}.png'
                    Image.new('RGBA', (1152, 1152), (110, 120, 130, 255)).save(tile_path)
                    reference_path = references / f'{name}.png'
                    reference_path.write_bytes(b'context')
                    tiles.append({'tile': name, 'sourcePath': f'region/{name}.png',
                                  'logicalPosition': [640 + col * 256, 420 + row * 256],
                                  'logicalSize': [256, 256], 'sourceSha256': hashlib.sha256(tile_path.read_bytes()).hexdigest(),
                                  'inputReference': f'references/{name}.png',
                                  'generationResultPixels': [1152, 1152]})
            manifest = {'version': 1, 'status': 'unreviewed', 'sourceMap': 'map.png',
                        'sourceMapSha256': hashlib.sha256(original_map_path.read_bytes()).hexdigest(),
                        'gameWorldOffset': [-184, -313], 'mapRect': [640, 420, 512, 512],
                        'logicalSize': [512, 512], 'tileGrid': [2, 2], 'paddingUsedForReference': 16,
                        'tiles': tiles}
            manifest_path = region / 'masters.json'; manifest_path.write_text(json.dumps(manifest))
            output = root / 'stitched.png'
            pack_map_region(manifest_path, root, output)
            with Image.open(output) as image:
                alpha = image.getchannel('A')
                self.assertEqual(alpha.getpixel((500, 100)), 0)
                self.assertEqual(alpha.getpixel((500, 1200)), 255)
                edge = [alpha.getpixel((x, y)) for x in range(480, 520) for y in range(710, 730)]
                self.assertTrue(any(0 < value < 255 for value in edge))


if __name__ == '__main__':
    unittest.main()
