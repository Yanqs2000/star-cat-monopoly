from contextlib import contextmanager
from importlib.util import module_from_spec, spec_from_file_location
import builtins
import hashlib
import json
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest import mock
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
    @contextmanager
    def _builder_sandbox(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'source'
            source.mkdir()
            for index in range(1001):
                (source / f'{index}.png').touch()

            ffdec = root / 'ffdec'
            (ffdec / 'lib').mkdir(parents=True)
            (ffdec / 'lib/ffdec_lib.jar').touch()
            dest = root / 'dest'
            cache = root / 'cache'

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
                yield dest, cache, convert

    def test_unavailable_numpy_preserves_owned_output_and_cache_before_mirror_conversion(self):
        with self._builder_sandbox() as (dest, cache, convert):
            (dest / 'nested').mkdir(parents=True)
            (dest / 'hd-manifest.json').write_bytes(b'owned manifest\n')
            (dest / 'nested/previous.webp').write_bytes(b'last good output\x00\xff')
            (cache / 'nested').mkdir(parents=True)
            (cache / 'nested/previous.bin').write_bytes(b'last good cache\x00\xff')

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
            with patch('builtins.__import__', side_effect=import_without_numpy):
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
        with self._builder_sandbox() as (dest, cache, convert):
            dest.mkdir()
            (dest / 'hd-manifest.json').write_bytes(b'owned manifest\n')
            (dest / 'previous.webp').write_bytes(b'last good output\x00\xff')
            cache.mkdir()
            (cache / 'previous.bin').write_bytes(b'last good cache\x00\xff')

            with self.assertRaisesRegex(SystemExit, '^mirror conversion started$'):
                BUILDER.main()

            self.assertEqual(convert.call_count, 1001)
            self.assertFalse((dest / 'previous.webp').exists())
            self.assertFalse((cache / 'previous.bin').exists())
class CharacterPatchedSwfDigest(unittest.TestCase):
    def test_main_computes_one_digest_for_all_character_uses(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'public/modern/assets'
            dest = root / 'public/modern/assets-hd'
            cache = root / 'cache'
            original = root / 'public/original'
            hd_source = root / 'public/hd-assets'
            ffdec = root / 'ffdec'
            source.mkdir(parents=True)
            original.mkdir(parents=True)
            hd_source.mkdir(parents=True)
            (ffdec / 'lib').mkdir(parents=True)
            (ffdec / 'lib/ffdec_lib.jar').write_bytes(b'')

            def write_json(path, value):
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(value))

            original_bytes = b'original-star-2'
            original_hash = hashlib.sha256(original_bytes).hexdigest()
            (original / 'star2.swf').write_bytes(original_bytes)
            write_json(original / 'manifest.json', {'files': [
                *[{'name': f'star{cid}.swf', 'sha256': original_hash} for cid in range(1, 13)],
                {'name': 'play.swf', 'sha256': original_hash},
            ]})
            Image.new('RGBA', (1, 1), (10, 20, 30, 255)).save(hd_source / 'aniu.png')

            facings = ('down', 'left', 'right', 'up')
            actions = ('happy', 'sad', 'angry', 'surprise', 'laugh')
            god_ids = (2, 3, 4, 5, 10, 11)
            bounds = [0, 20, 0, 20]
            walk_clips = [
                {'facing': facing, 'sourceBoundsTwips': bounds, 'frameCount': 1}
                for facing in facings
            ]
            original_walk_clips = [
                {'facing': facing, 'sourceSpriteId': 100 + index, 'sourceBoundsTwips': bounds,
                 'frames': [{'durationMs': 33, 'offsetX': index, 'offsetY': -index}]}
                for index, facing in enumerate(facings)
            ]
            reaction_clips = [
                {'name': action, 'facing': facing, 'renderBoundsTwips': bounds, 'frames': 1}
                for action in actions for facing in facings
            ]
            cheer_clips = [
                {'name': 'cheer', 'facing': facing, 'renderBoundsTwips': bounds, 'frames': 1}
                for facing in facings
            ]
            original_reaction_clips = [
                {'name': action, 'facing': facing, 'fps': 10, 'loop': False,
                 'frames': [{'width': 1, 'height': 1, 'offsetX': 0, 'offsetY': 0}]}
                for action in (*actions, 'cheer') for facing in facings
            ]
            god_overlays = [
                {'godId': god_id, 'renderBoundsTwips': bounds}
                for god_id in god_ids
            ]
            original_god_overlays = [
                {'godId': god_id, 'width': 1, 'height': 1, 'offsetX': 0, 'offsetY': 0}
                for god_id in god_ids
            ]
            write_json(source / 'characters/index.json', {'characters': [
                {'id': 2, 'manifestUrl': 'assets/characters/2/walk/manifest.json'},
            ]})
            write_json(source / 'characters/2/walk/manifest.json', {'clips': original_walk_clips})
            write_json(source / 'characters/2/reactions/manifest.json', {
                'clips': original_reaction_clips,
                'godOverlays': original_god_overlays,
            })

            def export_frame(path):
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.new('RGBA', (2, 2), (40, 50, 60, 255)).save(path)

            def fake_run(args, log):
                if 'ExportModernWalkAssets' in args:
                    output = Path(args[args.index('ExportModernWalkAssets') + 2])
                    for clip in walk_clips:
                        export_frame(output / clip['facing'] / '1.png')
                    return json.dumps({'pixelDensity': 2, 'clips': walk_clips})
                if 'ExportReactionAssets' in args:
                    output = Path(args[args.index('ExportReactionAssets') + 2])
                    clips = cheer_clips if args[-1] == 'cheer' else reaction_clips
                    for clip in clips:
                        export_frame(output / clip['name'] / clip['facing'] / '1.png')
                    if args[-1] == 'cheer':
                        return json.dumps({'clips': clips})
                    for god_id in god_ids:
                        export_frame(output / 'gods' / f'{god_id}.png')
                    return json.dumps({'clips': clips, 'godOverlays': god_overlays})
                return ''

            patched_bytes = b'patched-star-2'

            def patch_swf(swf, patched, assets):
                patched.write_bytes(patched_bytes)
                return {}

            patcher = SimpleNamespace(patch_swf=patch_swf)
            loader = SimpleNamespace(exec_module=lambda module: None)
            fake_spec = SimpleNamespace(loader=loader)
            real_digest = BUILDER.digest

            class CharacterBuildComplete(Exception):
                pass

            def stop_after_character(path):
                if Path(path) == original / 'play.swf':
                    raise CharacterBuildComplete
                return real_digest(path)

            patched = cache / 'swf/star2-hd.swf'
            with mock.patch.multiple(BUILDER, ROOT=root, SOURCE=source, DEST=dest, CACHE=cache,
                                     ORIGINAL=original, HD_SOURCE=hd_source, FFDEC=ffdec,
                                     JAVA='java', CHARS=[(2, 'aniu', 'aniu.png')]), \
                    mock.patch.dict(BUILDER.ENTRIES, clear=True), \
                    mock.patch.object(BUILDER, 'mirror_sources', return_value=[]), \
                    mock.patch.object(BUILDER, 'run', side_effect=fake_run), \
                    mock.patch.object(BUILDER, 'jdk', side_effect=lambda name: name), \
                    mock.patch.object(BUILDER.importlib.util, 'spec_from_file_location', return_value=fake_spec), \
                    mock.patch.object(BUILDER.importlib.util, 'module_from_spec', return_value=patcher), \
                    mock.patch.object(BUILDER, 'digest', side_effect=stop_after_character) as digest_mock:
                with self.assertRaises(CharacterBuildComplete):
                    BUILDER.main()
                entries = list(BUILDER.ENTRIES.values())

            patched_digest_calls = [
                call for call in digest_mock.call_args_list if Path(call.args[0]) == patched
            ]
            expected_hash = hashlib.sha256(patched_bytes).hexdigest()
            self.assertEqual(sum(entry.get('action') == 'walk' for entry in entries), 4)
            self.assertEqual(sum(entry.get('action') in actions for entry in entries), 20)
            self.assertEqual(sum('godId' in entry for entry in entries), 6)
            self.assertEqual(sum(entry.get('action') == 'cheer' for entry in entries), 4)
            self.assertEqual(
                {entry['renderSwfSha256'] for entry in entries},
                {expected_hash},
            )
            self.assertEqual(len(patched_digest_calls), 1)


if __name__ == '__main__':
    unittest.main()
