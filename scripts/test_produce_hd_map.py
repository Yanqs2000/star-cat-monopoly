import itertools
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image

import produce_hd_map as production
from produce_hd_map import context_sizes


class ReferenceGeometryTests(unittest.TestCase):
    def test_every_neighbor_is_visible_without_exceeding_native_four_x_budget(self):
        sides = ['left', 'right', 'top', 'bottom']
        for count in range(1, 5):
            for known in itertools.combinations(sides, count):
                context = context_sizes(known)
                width = 256 + context['left'] + context['right']
                height = 256 + context['top'] + context['bottom']
                self.assertLessEqual(width * height * 16, 1536 * 1024)
                for side in sides:
                    self.assertGreaterEqual(context[side], 16 if side in known else 0)
                    if side not in known:
                        self.assertEqual(context[side], 0)

    def test_two_neighbor_corner_keeps_substantial_context_on_both_edges(self):
        context = context_sizes(['left', 'top'])
        self.assertGreaterEqual(context['left'], 56)
        self.assertGreaterEqual(context['top'], 56)

    def test_unreviewed_neighbor_is_not_used_as_finished_reference(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'public/modern/assets/map.png'
            source.parent.mkdir(parents=True)
            Image.new('RGBA', (8, 4), (80, 120, 50, 255)).save(source)
            assembled = root / 'work/assembled'
            assembled.mkdir(parents=True)
            Image.new('RGBA', (18, 18), (200, 30, 20, 255)).save(assembled/'r0c0.png')
            state = root / 'generation.json'
            state.write_text(json.dumps({'tiles': [
                {'id': 'r0c0', 'row': 0, 'col': 0, 'rect': [0, 0, 4, 4], 'status': 'pending-visual-review'},
                {'id': 'r0c1', 'row': 0, 'col': 1, 'rect': [4, 0, 4, 4], 'status': 'pending'},
            ]}))
            with patch.multiple(production, ROOT=root, STATE=state, WORK=root/'work', CACHE=root/'cache'):
                reference = production.reference('r0c1')
            self.assertEqual(reference['referenceRect'], [4, 0, 4, 4])
            with Image.open(reference['target']) as target:
                self.assertEqual(target.getchannel('A').getextrema(), (0, 0))

            # An opaque inland pipeline must not silently clip new art to an old cloud outline.
            with Image.open(source) as original:
                image = original.convert('RGBA')
            image.putpixel((6, 1), (0, 0, 0, 0))
            image.save(source)
            with patch.multiple(production, ROOT=root, STATE=state, WORK=root/'work', CACHE=root/'cache'):
                with self.assertRaisesRegex(ValueError, 'silhouette'):
                    production.reference('r0c1')


if __name__ == '__main__':
    unittest.main()
