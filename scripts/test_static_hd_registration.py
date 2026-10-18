"""Regression checks for transparent sprite canvas padding and real detail density."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image, ImageDraw
import register_static_hd_master as production


class StaticRegistrationTests(unittest.TestCase):
    def prepare(self, root, kind='property', bounds=(150, 700, 999, 1599)):
        source = root / 'public/modern/assets/fixture.png'
        source.parent.mkdir(parents=True)
        original = Image.new('RGBA', (90, 124))
        ImageDraw.Draw(original).rectangle((10, 50, 85, 121), fill='white')
        original.save(source)
        master = root / 'generated.png'
        image = Image.new('RGBA', (1200, 1800))
        ImageDraw.Draw(image).rectangle(bounds, fill='white')
        image.save(master)
        (root / 'docs/modernization').mkdir(parents=True)
        (root / 'src/modern/data').mkdir(parents=True)
        (root / 'docs/modernization/static-hd-production.json').write_text(json.dumps({'jobs': [{
            'source': 'assets/fixture.png', 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'kind': kind, 'aliases': [], 'status': 'pending-generation'}]}))
        (root / 'src/modern/data/static-hd-assets.json').write_text('{"assets":[]}')
        return master

    def test_transparent_sprite_padding_can_differ_while_visible_footprint_is_registered(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            master = self.prepare(root)
            with patch.object(production, 'ROOT', root):
                result = production.register('assets/fixture.png', master, 'test fixture, not production art')
            self.assertEqual(result['logicalSize'], [90, 124])
            self.assertEqual(result['registration']['sourceBounds'], [10, 50, 86, 122])
            with Image.open(master) as original, Image.open(root / 'public/modern' / result['url']) as output:
                self.assertEqual(original.convert('RGBA').resize(tuple(result['pixelSize']), Image.Resampling.LANCZOS).getchannel('A').tobytes(),
                                 output.convert('RGBA').getchannel('A').tobytes())

    def test_large_empty_canvas_does_not_count_as_high_resolution_visible_artwork(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            master = self.prepare(root, bounds=(150, 1400, 249, 1499))
            with patch.object(production, 'ROOT', root), self.assertRaisesRegex(ValueError, 'Visible artwork'):
                production.register('assets/fixture.png', master, 'test')

    def test_event_illustration_still_requires_original_canvas_aspect_ratio(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            master = self.prepare(root, kind='event-illustration')
            with patch.object(production, 'ROOT', root), self.assertRaisesRegex(ValueError, 'aspect ratio'):
                production.register('assets/fixture.png', master, 'test')

    def test_panel_with_internal_transparent_hole_is_rejected_before_install(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            master = self.prepare(root, kind='activity-panel')
            source = root / 'public/modern/assets/fixture.png'
            Image.new('RGBA', (400, 300), 'orange').save(source)
            queue_path = root / 'docs/modernization/static-hd-production.json'
            queue = json.loads(queue_path.read_text())
            queue['jobs'][0]['sourceSha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
            queue_path.write_text(json.dumps(queue))
            panel = Image.new('RGBA', (1600, 1200), 'orange')
            ImageDraw.Draw(panel).ellipse((700, 400, 900, 600), fill=(255, 120, 60, 0))
            panel.save(master)
            with patch.object(production, 'ROOT', root), self.assertRaisesRegex(ValueError, 'interior opacity'):
                production.register('assets/fixture.png', master, 'test')
            self.assertEqual(json.loads((root / 'src/modern/data/static-hd-assets.json').read_text()), {'assets': []})


if __name__ == '__main__':
    unittest.main()
