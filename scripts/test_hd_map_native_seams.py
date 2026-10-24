import unittest
import numpy as np
from PIL import Image
import hd_map_seams as seams


class NativeMapAlphaTests(unittest.TestCase):
    def test_nearly_opaque_body_with_border_connected_sky_keeps_native_alpha(self):
        self.assertTrue(hasattr(seams, 'native_alpha_audit'), 'Native RGBA audit is missing')
        image = np.full((40, 40, 4), [80, 180, 20, 251], dtype=np.uint8)
        image[:5, :10] = [0, 0, 0, 0]
        before = image.copy()
        audit = seams.native_alpha_audit(Image.fromarray(image))
        self.assertEqual(audit['enclosedLowAlphaPixels'], 0)
        self.assertEqual(audit['borderConnectedLowAlphaPixels'], 50)
        self.assertEqual(audit['solidAlphaMedian'], 251)
        np.testing.assert_array_equal(image, before)

    def test_enclosed_low_alpha_hole_is_rejected(self):
        self.assertTrue(hasattr(seams, 'native_alpha_audit'), 'Native RGBA audit is missing')
        image = np.full((40, 40, 4), [80, 180, 20, 251], dtype=np.uint8)
        image[18:22, 18:22, 3] = 0
        with self.assertRaisesRegex(ValueError, 'enclosed'):
            seams.native_alpha_audit(Image.fromarray(image))

    def test_original_enclosed_sky_window_is_allowed_without_changing_rgba(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[12:24, 12:24, 3] = 0
        native = np.full((80, 80, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[26:48, 24:48, 3] = 0
        source, image = Image.fromarray(reference), Image.fromarray(native)
        before_source, before_native = source.tobytes(), image.tobytes()
        try:
            audit = seams.native_alpha_audit(image, permitted_reference=source)
        except (TypeError, ValueError) as error:
            self.fail(f'Original sky window was rejected as a new artwork hole: {error}')
        self.assertEqual(audit['enclosedLowAlphaPixels'], 528)
        self.assertEqual(audit['referenceApprovedSkyPixels'], 528)
        self.assertEqual(source.tobytes(), before_source)
        self.assertEqual(image.tobytes(), before_native)

    def test_reference_window_does_not_authorize_an_extra_hole_in_solid_art(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[12:24, 12:24, 3] = 0
        native = np.full((80, 80, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[24:48, 24:48, 3] = 0
        native[60:64, 60:64, 3] = 0
        with self.assertRaisesRegex(ValueError, 'unmatched enclosed'):
            seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))

    def test_reference_exterior_sky_does_not_authorize_a_new_enclosed_hole(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[:10, :10, 3] = 0
        native = np.full((80, 80, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[8:12, 8:12, 3] = 0
        with self.assertRaisesRegex(ValueError, 'unmatched enclosed'):
            seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))

    def test_reference_window_does_not_allow_a_substantially_enlarged_hole(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[12:24, 12:24, 3] = 0
        native = np.full((80, 80, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[10:62, 10:62, 3] = 0
        with self.assertRaisesRegex(ValueError, 'unmatched enclosed'):
            seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))

    def test_source_window_registration_checks_whole_component_not_one_contour_pixel(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[10:30, 10:15, 3] = 0
        reference[25:30, 10:30, 3] = 0
        native = np.full((80, 80, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[20:60, 20:30, 3] = 0
        native[50:60, 20:60, 3] = 0
        native[38, 30:39, 3] = 0
        try:
            audit = seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))
        except ValueError as error:
            self.fail(f'Same source window with a small contour registration change was rejected: {error}')
        self.assertEqual(audit['referenceApprovedSkyPixels'], 709)
        self.assertGreater(audit['referenceRegistrationOutlierPixels'], 0)

    def test_large_matching_window_cannot_hide_a_tiny_separate_hole(self):
        reference = np.full((100, 100, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[20:80, 20:80, 3] = 0
        native = np.full((200, 200, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[40:160, 40:160, 3] = 0
        native[10, 10, 3] = 0
        with self.assertRaisesRegex(ValueError, 'unmatched enclosed'):
            seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))

    def test_reference_window_bounds_allow_one_native_pixel_of_resize_rounding(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[12:24, 12:24, 3] = 0
        native = np.full((83, 83, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[25:50, 25:41, 3] = 0
        try:
            audit = seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))
        except ValueError as error:
            self.fail(f'One native pixel of resize rounding rejected the matching window: {error}')
        self.assertEqual(audit['referenceApprovedSkyPixels'], 400)

    def test_semitransparent_source_shading_does_not_authorize_an_empty_hole(self):
        reference = np.full((40, 40, 4), [100, 160, 30, 255], dtype=np.uint8)
        reference[18:22, 18:22, 3] = 180
        native = np.full((80, 80, 4), [100, 160, 30, 249], dtype=np.uint8)
        native[36:44, 36:44, 3] = 0
        with self.assertRaisesRegex(ValueError, 'unmatched enclosed'):
            seams.native_alpha_audit(Image.fromarray(native), permitted_reference=Image.fromarray(reference))

    def test_translucent_sheet_without_solid_art_is_rejected(self):
        self.assertTrue(hasattr(seams, 'native_alpha_audit'), 'Native RGBA audit is missing')
        with self.assertRaisesRegex(ValueError, 'solid'):
            seams.native_alpha_audit(Image.new('RGBA', (40, 40), (80, 180, 20, 180)))

    def test_small_native_antialias_variation_is_not_misclassified_as_an_empty_hole(self):
        image = np.full((40, 40, 4), [80, 180, 20, 251], dtype=np.uint8)
        image[18, 18, 3] = 239
        try:
            audit = seams.native_alpha_audit(Image.fromarray(image))
        except ValueError as error:
            self.fail(f'Native antialias variation was mistaken for an empty hole: {error}')
        self.assertEqual(audit['enclosedLowAlphaPixels'], 0)
        self.assertEqual(image[18, 18, 3], 239)

    def test_native_cut_preserves_both_inputs_and_selects_original_rgba_pixels(self):
        self.assertTrue(hasattr(seams, 'native_overlap_cut'), 'Native RGBA cut is missing')
        old = np.full((40, 20, 4), [80, 180, 20, 255], dtype=np.uint8)
        new = np.full((40, 20, 4), [80, 180, 20, 251], dtype=np.uint8)
        new[:, -4:, 0] = 120
        before_old, before_new = old.copy(), new.copy()
        mask, path, stats = seams.native_overlap_cut(Image.fromarray(old), Image.fromarray(new), transition=8)
        result = np.where(mask[:, :, None], new, old)
        self.assertTrue(mask.any())
        np.testing.assert_array_equal(result[mask], new[mask])
        np.testing.assert_array_equal(result[~mask], old[~mask])
        np.testing.assert_array_equal(old, before_old)
        np.testing.assert_array_equal(new, before_new)
        self.assertLess(stats['meanRgbDifference'], 4)
        self.assertTrue(np.all(result[:, :, 3][mask] == 251))

    def test_native_cut_does_not_hide_a_large_visual_disagreement(self):
        self.assertTrue(hasattr(seams, 'native_overlap_cut'), 'Native RGBA cut is missing')
        old = Image.new('RGBA', (20, 40), (0, 0, 0, 255))
        new = Image.new('RGBA', (20, 40), (255, 255, 255, 251))
        _, _, stats = seams.native_overlap_cut(old, new, transition=8)
        self.assertGreater(stats['meanRgbDifference'], 12)
        self.assertGreater(stats['p95RgbDifference'], 40)


if __name__ == '__main__':
    unittest.main()
