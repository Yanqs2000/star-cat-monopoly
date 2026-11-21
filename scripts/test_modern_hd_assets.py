from importlib.util import module_from_spec, spec_from_file_location
import builtins
import hashlib
import sys
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPEC = spec_from_file_location('build_modern_hd_assets', ROOT / 'scripts/build-modern-hd-assets.py')
assert SPEC and SPEC.loader
BUILDER = module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)
VERIFY_SPEC = spec_from_file_location('verify_modern_hd_assets', ROOT / 'scripts/verify-modern-hd-assets.py')
assert VERIFY_SPEC and VERIFY_SPEC.loader
VERIFY = module_from_spec(VERIFY_SPEC)
VERIFY_SPEC.loader.exec_module(VERIFY)
WORLD_SPEC = spec_from_file_location('export_world_assets', ROOT / 'scripts/export-world-assets.py')
assert WORLD_SPEC and WORLD_SPEC.loader
WORLD = module_from_spec(WORLD_SPEC)
sys.modules[WORLD_SPEC.name] = WORLD
WORLD_SPEC.loader.exec_module(WORLD)


class ProfilePixelDimensions(unittest.TestCase):
    def test_original_bitmap_is_resampled_to_two_pixel_density(self):
        source = Image.new('RGBA', (3, 4), (90, 120, 210, 128))
        result = BUILDER.profile_pixels(source, already_density=False, expected_size=(6, 8))
        self.assertEqual(result.size, (6, 8))
        self.assertEqual(result.mode, 'RGBA')
        self.assertEqual(result.getpixel((0, 0))[3], 128)

    def test_two_x_swf_render_is_not_resampled_again(self):
        source = Image.new('RGBA', (6, 8), (90, 120, 210, 128))
        result = BUILDER.profile_pixels(source, already_density=True, expected_size=(6, 8))
        self.assertEqual(result.size, (6, 8))
        self.assertEqual(result.getpixel((0, 0))[3], 128)

    def test_rejects_wrong_pixel_bounds(self):
        source = Image.new('RGBA', (6, 8), (90, 120, 210, 128))
        with self.assertRaises(SystemExit):
            BUILDER.profile_pixels(source, already_density=True, expected_size=(12, 16))

    def test_verifier_rejects_an_opaque_webp_replacement_for_transparent_art(self):
        transparent = Image.new('RGBA', (2, 2), (90, 120, 210, 0))
        entry = {
            'expectedAlphaSha256': hashlib.sha256(transparent.getchannel('A').tobytes()).hexdigest(),
            'sourceHasTransparency': True,
        }
        VERIFY.verify_alpha(entry, transparent)
        opaque = Image.new('RGBA', (2, 2), (90, 120, 210, 255))
        with self.assertRaises(SystemExit):
            VERIFY.verify_alpha(entry, opaque)

    def test_world_vector_frame_bounds_and_anchor_scale_with_density(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'render.png'
            target = root / 'normalized.png'
            Image.new('RGBA', (2, 2), (250, 20, 20, 255)).save(source)
            WORLD.normalize_png(source, target, [20, 40, 20, 40], (0, 40, 0, 40), density=2)
            with Image.open(target) as result:
                self.assertEqual(result.size, (4, 4))
                self.assertEqual(result.getpixel((0, 0))[3], 0)
                self.assertEqual(result.getpixel((2, 2)), (250, 20, 20, 255))

    def test_rerendered_activity_keeps_exact_two_x_logical_canvas_when_export_rounds_one_pixel_short(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source, target = root / 'native.png', root / 'fitted.png'
            Image.new('RGBA', (7, 5), (10, 30, 90, 255)).save(source)
            padding = BUILDER.fit_transparent_canvas(source, target, (4, 3))
            with Image.open(target) as result:
                self.assertEqual(result.size, (8, 6))
                self.assertEqual(result.getpixel((6, 4)), (10, 30, 90, 255))
                self.assertEqual(result.getpixel((7, 5))[3], 0)
            self.assertEqual(padding, {'nativeRenderSize': [7, 5], 'fitPaddingPx': [1, 1]})


class ModernHdDependencyPreflight(unittest.TestCase):
    def test_unavailable_numpy_preserves_owned_output_and_cache_before_mirror_conversion(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'source'
            source.mkdir()
            for index in range(1001):
                (source / f'{index}.png').touch()

            dest = root / 'dest'
            (dest / 'nested').mkdir(parents=True)
            (dest / 'hd-manifest.json').write_bytes(b'owned manifest\n')
            (dest / 'nested/previous.webp').write_bytes(b'last good output\x00\xff')
            cache = root / 'cache'
            (cache / 'nested').mkdir(parents=True)
            (cache / 'nested/previous.bin').write_bytes(b'last good cache\x00\xff')

            ffdec = root / 'ffdec'
            (ffdec / 'lib').mkdir(parents=True)
            (ffdec / 'lib/ffdec_lib.jar').touch()

            def file_bytes(directory):
                if not directory.exists():
                    return None
                return {
                    path.relative_to(directory).as_posix(): path.read_bytes()
                    for path in directory.rglob('*') if path.is_file()
                }

            original_dest = file_bytes(dest)
            original_cache = file_bytes(cache)
            real_import = builtins.__import__

            def import_without_numpy(name, *args, **kwargs):
                if name == 'numpy':
                    raise ImportError('NumPy blocked by regression test')
                return real_import(name, *args, **kwargs)

            message = ''
            with (
                patch.multiple(
                    BUILDER,
                    ROOT=root,
                    SOURCE=source,
                    DEST=dest,
                    CACHE=cache,
                    FFDEC=ffdec,
                    JAVA='java',
                ),
                patch('builtins.__import__', side_effect=import_without_numpy),
                patch.object(BUILDER, 'convert', side_effect=SystemExit('mirror conversion started')) as convert,
            ):
                try:
                    BUILDER.main()
                except SystemExit as error:
                    message = str(error)

            actual = {
                'clear NumPy error': 'NumPy' in message and 'unavailable' in message,
                'conversion calls': convert.call_count,
                'destination': file_bytes(dest),
                'cache': file_bytes(cache),
            }
            self.assertEqual(actual, {
                'clear NumPy error': True,
                'conversion calls': 0,
                'destination': original_dest,
                'cache': original_cache,
            })

    def test_available_numpy_enters_existing_mirror_generation(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'source'
            source.mkdir()
            for index in range(1001):
                (source / f'{index}.png').touch()

            dest = root / 'dest'
            dest.mkdir()
            (dest / 'hd-manifest.json').write_bytes(b'owned manifest\n')
            (dest / 'previous.webp').write_bytes(b'last good output\x00\xff')
            cache = root / 'cache'
            cache.mkdir()
            (cache / 'previous.bin').write_bytes(b'last good cache\x00\xff')
            ffdec = root / 'ffdec'
            (ffdec / 'lib').mkdir(parents=True)
            (ffdec / 'lib/ffdec_lib.jar').touch()

            with (
                patch.multiple(
                    BUILDER,
                    ROOT=root,
                    SOURCE=source,
                    DEST=dest,
                    CACHE=cache,
                    FFDEC=ffdec,
                    JAVA='java',
                ),
                patch.object(BUILDER, 'convert', side_effect=SystemExit('mirror conversion started')) as convert,
            ):
                with self.assertRaisesRegex(SystemExit, '^mirror conversion started$'):
                    BUILDER.main()

            self.assertEqual(convert.call_count, 1001)
            self.assertFalse((dest / 'previous.webp').exists())
            self.assertFalse((cache / 'previous.bin').exists())


if __name__ == '__main__':
    unittest.main()
