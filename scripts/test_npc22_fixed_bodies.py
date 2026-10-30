"""Regression on the delivered frames: gesture motion must not deform a face.

These regions were marked on the canonical density-two body image, not on
changing pose bounds. Outer source float is deliberately excluded: this is
the local body, before the original independent world trajectory is applied.
"""
import json
import importlib.util
import math
from pathlib import Path
import unittest
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REGIONS = {
 'npc-2': [(20, 0, 120, 78)],
 'npc-5': [(72, 42, 104, 61), (108, 90, 205, 202)],
 'npc-10': [(50, 65, 106, 98), (48, 20, 105, 59), (43, 115, 109, 138)],
 'npc-11': [(80, 49, 146, 97), (82, 126, 131, 151)],
}


class FixedBodiesTest(unittest.TestCase):
 def test_devil_fork_outline_is_stationary_while_the_rear_wing_moves(self):
  data = json.loads((ROOT/'src/modern/data/npc-22.json').read_text())
  clip = next(c for c in data['worldClips'] if c['id'] == 'npc-11')
  first = clip['frames'][0]
  canonical = np.asarray(Image.open(ROOT/'public/modern'/first['url']).convert('RGBA'))
  rgb = canonical[:, :, :3].astype(int)
  yy, xx = np.indices(canonical.shape[:2])
  # The fork's cool gray/white top prong. The pink membrane surrounding it
  # belongs to the wing, so the full rectangular region must not be frozen.
  fork = ((rgb[:, :, 0] <= rgb[:, :, 1]+8) &
          (rgb[:, :, 0] <= rgb[:, :, 2]+8) & (canonical[:, :, 3] > 220) &
          (xx > 155) & (xx < 197) & (yy > 86) & (yy < 120))
  for index, frame in enumerate(clip['frames']):
   image = Image.new('RGBA', (400, 400))
   image.alpha_composite(Image.open(ROOT/'public/modern'/frame['url']).convert('RGBA'),
    (round(100+2*(frame['offsetX']-first['offsetX'])), round(100+2*(frame['offsetY']-first['offsetY']))))
   actual = np.asarray(image.crop((100, 100, 100+canonical.shape[1], 100+canonical.shape[0])))
   with self.subTest(frame=index):
    self.assertTrue(np.array_equal(actual[fork], canonical[fork]), 'wing moved the fork edge')

 def test_fixed_face_and_body_pixels_survive_the_entire_local_gesture(self):
  data = json.loads((ROOT/'src/modern/data/npc-22.json').read_text())
  for npc, regions in REGIONS.items():
   clip = next(c for c in data['worldClips'] if c['id'] == npc)
   first = clip['frames'][0]
   reference = Image.open(ROOT/'public/modern'/first['url']).convert('RGBA')
   for index, frame in enumerate(clip['frames']):
    # Register each trimmed frame back to the canonical origin. A changing
    # silhouette must never re-center the complete character.
    image = Image.new('RGBA', (400, 400))
    local = Image.open(ROOT/'public/modern'/frame['url']).convert('RGBA')
    dx = round(100 + 2*(frame['offsetX']-first['offsetX']))
    dy = round(100 + 2*(frame['offsetY']-first['offsetY']))
    image.alpha_composite(local, (dx, dy))
    for rect in regions:
     expected = np.asarray(reference.crop(rect))
     shifted = tuple(v+100 for v in rect)
     actual = np.asarray(image.crop(shifted))
     opaque = expected[:, :, 3] > 220
     with self.subTest(npc=npc, frame=index, region=rect):
      self.assertTrue(np.array_equal(actual[opaque], expected[opaque]),
                      'local gesture moved or repainted stationary anatomy')

 def test_gestures_use_canonical_anatomy_and_change_between_source_ticks(self):
  import npc22_gesture_rigs
  spec = importlib.util.spec_from_file_location('npc22_build', ROOT/'scripts/build-npc22.py')
  builder = importlib.util.module_from_spec(spec)
  spec.loader.exec_module(builder)
  review = ROOT/'public/hd-review/characters-22-23'
  source = json.loads((review/'source-timeline.json').read_text())
  definitions = json.loads((review/'npc-pose-index.json').read_text())
  layouts = json.loads((review/'npc-atlas-layout.json').read_text())
  for npc in REGIONS:
   definition = next(d for d in definitions if d['id'] == npc)
   poses = builder.split_atlas(Image.open(review/f'{npc}-master.png'),
                               definition['uniqueCompositePoses'], layouts.get(npc))
   rects, _ = builder.source_body_rects(source, definition['sourceSymbol'],
                                       len(definition['framePoseIndicesZeroBased']))
   union = builder.union_rect(rects)
   canvas = tuple([math.floor(v)-16 for v in union[:2]]+[math.ceil(v)+16 for v in union[2:]])
   registered = [builder.register_pose(p, rects[f-1], canvas, 2)
                 for p, f in zip(poses, definition['poseFirstFramesOneBased'])]
   sampler = npc22_gesture_rigs.prepare_rig(npc, registered, 2, canvas, ROOT, definition)
   poison = [registered[0]]+[Image.new('RGBA', registered[0].size, 'magenta') for _ in poses[1:]]
   other = npc22_gesture_rigs.prepare_rig(npc, poison, 2, canvas, ROOT, definition)
   times = (7, 7.25, 7.5, 7.75) if npc == 'npc-2' else (2.5, 2.75, 3, 3.25)
   samples = [sampler(t) for t in times]
   with self.subTest(npc=npc):
    origin = registered[0].getbbox()
    for rect in REGIONS[npc]:
     box = tuple(round(v+(origin[i % 2]-1)) for i, v in enumerate(rect))
     expected = np.asarray(registered[0].crop(box))
     actual = np.asarray(sampler(0).crop(box))
     opaque = expected[:, :, 3] > 220
     self.assertTrue(np.array_equal(actual[opaque], expected[opaque]), 'canonical face/body identity was repainted')
    self.assertEqual(len({im.tobytes() for im in samples}), len(times), 'gesture is only a sparse pose hold')
    self.assertEqual(samples[1].tobytes(), other(times[1]).tobytes(), 'another generated face entered the local rig')
    period = len(definition['framePoseIndicesZeroBased'])
    self.assertEqual(sampler(0).tobytes(), sampler(period).tobytes())
    if npc in ('npc-10', 'npc-11'):
     import cv2
     bounds = registered[0].getbbox()
     ox, oy = bounds[0]-1, bounds[1]-1
     _, fixed, _, _ = npc22_gesture_rigs._wing_parts(npc, registered[0], ox, oy, 1)
     rgba = np.asarray(registered[0])
     stationary = (np.asarray(fixed) > 0) & (rgba[:, :, 3] > 8)
     if npc == 'npc-10':
      yy, xx = np.indices(stationary.shape)
      x, y = xx-ox, yy-oy
      blue = rgba[:, :, 2].astype(int) > rgba[:, :, 0].astype(int)+30
      roots = ((x < 48) | (x > 108)) & (y > 82) & (y < 110)
      self.assertFalse((stationary & blue & roots).any(), 'old feather roots remain as fixed blue blocks')
     else:
      _, _, stats, _ = cv2.connectedComponentsWithStats(stationary.astype(np.uint8))
      areas = sorted(stats[1:, cv2.CC_STAT_AREA], reverse=True)
      self.assertTrue(all(area <= 1 for area in areas[1:]), 'detached wing edges remain on the fixed body layer')


if __name__ == '__main__': unittest.main()
