import unittest
import numpy as np
from PIL import Image
from hd_assets import remove_black_background, scale_bitmap_fill, tags, ROOT, OUTPUT
import zlib
import struct


class HdAssetsTests(unittest.TestCase):
    def test_background_removal_preserves_enclosed_black_detail(self):
        pixels = np.zeros((12, 12, 3), dtype=np.uint8)
        pixels[2:10, 2:10] = [220, 150, 70]
        pixels[5:7, 5:7] = 0
        result = np.array(remove_black_background(Image.fromarray(pixels)))
        self.assertEqual(result[0, 0, 3], 0)
        self.assertEqual(result[5, 5, 3], 255)
        np.testing.assert_array_equal(result[4, 4, :3], pixels[4, 4])

    def test_identity_fill_scale_keeps_shape_bytes(self):
        shape = bytes.fromhex('b3006e3e0e1166428a000243ffffd940000500000043b200d940000500000dc7c599000020158e10a297647c3b62a1d8e10ed75800')
        self.assertEqual(scale_bitmap_fill(shape, 178, 1, 1), shape)

    def test_dark_clothing_connected_to_outline_remains_visible(self):
        pixels = np.zeros((20, 20, 3), dtype=np.uint8)
        pixels[3:17, 3:17] = 10
        result = np.array(remove_black_background(Image.fromarray(pixels)))
        self.assertEqual(result[10, 10, 3], 255)
        self.assertEqual(result[0, 0, 3], 0)

    def test_missing_bitmap_reference_is_rejected(self):
        shape = bytes.fromhex('b3006e3e0e1166428a000243ffffd940000500000043b200d940000500000dc7c599000020158e10a297647c3b62a1d8e10ed75800')
        with self.assertRaises(ValueError):
            scale_bitmap_fill(shape, 999, 2, 2)

    def test_game_patch_changes_only_selected_building_bitmaps_and_shapes(self):
        original = list(tags(zlib.decompress((ROOT / 'public/original/play.swf').read_bytes()[8:])))
        patched = list(tags(zlib.decompress((OUTPUT / 'play.swf').read_bytes()[8:])))
        self.assertEqual(len(original), len(patched))
        ids = {178, 181, 187, 190, 193, 196, 199, 202, 205, 208, 211}
        changed = 0
        for (old_code, old_data), (new_code, new_data) in zip(original, patched):
            if (old_code, old_data) == (new_code, new_data):
                continue
            identity = struct.unpack_from('<H', old_data)[0]
            if old_code == 35:
                self.assertIn(identity, ids)
                self.assertEqual(new_code, 36)
                _, fmt, width, height = struct.unpack_from('<HBHH', new_data)
                self.assertEqual(fmt, 5)
                self.assertEqual(len(zlib.decompress(new_data[7:])), width * height * 4)
            else:
                self.assertEqual(old_code, 2)
                self.assertEqual(new_code, 2)
                self.assertIn(identity - 1, ids)
            changed += 1
        self.assertEqual(changed, 22)


if __name__ == '__main__':
    unittest.main()
