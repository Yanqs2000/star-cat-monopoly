import unittest
import numpy as np
from PIL import Image
from hd_map_seams import overlap_cut


class MapOverlapCutTests(unittest.TestCase):
    def test_cut_preserves_old_opaque_core_and_uses_only_original_source_pixels(self):
        rng = np.random.default_rng(17)
        old = rng.integers(0, 256, (80, 48, 4), dtype=np.uint8)
        new = rng.integers(0, 256, (80, 48, 4), dtype=np.uint8)
        old[:, :, 3] = new[:, :, 3] = 255
        mask, path, _ = overlap_cut(Image.fromarray(old), Image.fromarray(new), transition=12)
        self.assertEqual(path[0], 47)
        self.assertEqual(path[-1], 47)
        self.assertGreaterEqual(path.min(), 36)
        self.assertFalse(mask[:, :37].any())
        result = np.where(mask[:, :, None], new, old)
        np.testing.assert_array_equal(result[~mask], old[~mask])
        np.testing.assert_array_equal(result[mask], new[mask])
        self.assertTrue(np.all(result[:, :, 3] == 255))

    def test_texture_matched_cut_has_less_disagreement_than_fixed_edge(self):
        y, x = np.indices((100, 48))
        old = np.repeat((100 + 70 * np.sin((x+y) / 5))[:, :, None], 3, axis=2).astype(np.uint8)
        new = np.repeat((100 + 70 * np.sin((x+y+2) / 5))[:, :, None], 3, axis=2).astype(np.uint8)
        a = Image.fromarray(old).convert('RGBA')
        b = Image.fromarray(new).convert('RGBA')
        _, _, stats = overlap_cut(a, b, transition=20)
        fixed = np.abs(old[:, -1].astype(float) - new[:, -1]).mean()
        self.assertLess(stats['meanRgbDifference'], fixed * .7)

    def test_faded_runtime_reference_and_translucent_candidate_are_rejected(self):
        opaque = Image.new('RGBA', (48, 80), (80, 90, 100, 255))
        faded = opaque.copy()
        faded.putpixel((47, 40), (80, 90, 100, 0))
        for a, b in [(opaque, faded), (faded, opaque)]:
            with self.assertRaisesRegex(ValueError, 'opaque'):
                overlap_cut(a, b, transition=12)

    def test_cut_can_follow_steep_isometric_edge_inside_transition_band(self):
        # A thin matching road edge advances two columns per row, then returns.
        # Restricting the cut to one column per row forces it across a bright object.
        height, width = 61, 81
        expected = width - 1 - 2 * np.minimum(np.arange(height), np.arange(height)[::-1])
        old = np.zeros((height, width, 4), dtype=np.uint8)
        new = np.full_like(old, 220)
        old[:, :, 3] = new[:, :, 3] = 255
        new[np.arange(height), expected, :3] = 0
        _, path, stats = overlap_cut(Image.fromarray(old), Image.fromarray(new), transition=65)
        self.assertLess(stats['meanRgbDifference'], 1)
        np.testing.assert_array_equal(path, expected)


if __name__ == '__main__':
    unittest.main()
