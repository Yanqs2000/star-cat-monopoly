import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hd_map_tiles import split_map_image
from PIL import Image, ImageChops, ImageDraw
import numpy as np


class HdMapTileTests(unittest.TestCase):
    def test_512_region_splits_into_four_context_overlapped_256_tiles(self):
        source = Image.new('RGBA', (2228, 2228))
        draw = ImageDraw.Draw(source)
        draw.rectangle((0, 0, 1113, 1113), fill=(10, 20, 30, 255))
        draw.rectangle((1114, 0, 2227, 1113), fill=(40, 50, 60, 255))
        draw.rectangle((0, 1114, 1113, 2227), fill=(70, 80, 90, 255))
        draw.rectangle((1114, 1114, 2227, 2227), fill=(100, 110, 120, 255))

        chunks = split_map_image(source, logical_rect=(640, 420, 512, 512),
                                 pixel_density=2228 / 512, tile_size=256, overlap=1.25)

        self.assertEqual(['r0c0', 'r0c1', 'r1c0', 'r1c1'], [chunk['tileId'] for chunk in chunks])
        self.assertEqual([[640, 420, 256, 256], [896, 420, 256, 256],
                          [640, 676, 256, 256], [896, 676, 256, 256]],
                         [chunk['contentRect'] for chunk in chunks])
        self.assertEqual([1119, 1119], chunks[0]['pixelSize'])
        self.assertEqual([0, 0, 5, 5], chunks[0]['overlapPixels'])
        self.assertEqual([5, 0, 0, 5], chunks[1]['overlapPixels'])
        self.assertEqual([0, 5, 5, 0], chunks[2]['overlapPixels'])
        self.assertEqual([5, 5, 0, 0], chunks[3]['overlapPixels'])
        self.assertIsNone(ImageChops.difference(
            chunks[0]['image'].crop((1114, 0, 1119, 1119)),
            chunks[1]['image'].crop((0, 0, 5, 1119))).getbbox())
        self.assertIsNone(ImageChops.difference(
            chunks[0]['image'].crop((0, 1114, 1119, 1119)),
            chunks[2]['image'].crop((0, 0, 1119, 5))).getbbox())

    def test_edge_tiles_clip_overlap_and_keep_the_original_logical_extent(self):
        source = Image.new('RGBA', (1080, 1040), (20, 30, 40, 255))

        chunks = split_map_image(source, logical_rect=(0, 0, 270, 260),
                                 pixel_density=4, tile_size=256, overlap=1)

        self.assertEqual(4, len(chunks))
        self.assertEqual([0, 0, 256, 256], chunks[0]['contentRect'])
        self.assertEqual([256, 256, 14, 4], chunks[3]['contentRect'])
        self.assertEqual([60, 20], chunks[3]['pixelSize'])
        self.assertEqual([4, 4, 0, 0], chunks[3]['overlapPixels'])

    def test_content_cells_recompose_to_the_accepted_source_pixels(self):
        y, x = np.indices((2048, 2048))
        pixels = np.stack((x % 251, y % 253, (x + y) % 255,
                           np.where((x + y) % 29 == 0, 0, 255)), axis=2).astype(np.uint8)
        source = Image.fromarray(pixels, mode='RGBA')
        rebuilt = Image.new('RGBA', source.size)
        chunks = split_map_image(source, logical_rect=(640, 420, 512, 512),
                                 pixel_density=4, tile_size=256, overlap=1)

        for chunk in chunks:
            _, _, logical_width, logical_height = chunk['contentRect']
            width, height = round(logical_width * 4), round(logical_height * 4)
            left, top = chunk['overlapPixels'][:2]
            content = chunk['image'].crop((left, top, left + width, top + height))
            x_offset = round((chunk['contentRect'][0] - 640) * 4)
            y_offset = round((chunk['contentRect'][1] - 420) * 4)
            rebuilt.paste(content, (x_offset, y_offset))

        self.assertIsNone(ImageChops.difference(source, rebuilt).getbbox())

    def test_rejects_density_or_source_dimensions_that_do_not_match_region(self):
        source = Image.new('RGBA', (100, 100), (0, 0, 0, 255))
        with self.assertRaisesRegex(ValueError, 'pixel dimensions do not match'):
            split_map_image(source, logical_rect=(0, 0, 32, 32),
                            pixel_density=4, tile_size=16, overlap=1)
        with self.assertRaisesRegex(ValueError, 'density must be at least 4'):
            split_map_image(source, logical_rect=(0, 0, 50, 50),
                            pixel_density=2, tile_size=16, overlap=1)


if __name__ == '__main__':
    unittest.main()
