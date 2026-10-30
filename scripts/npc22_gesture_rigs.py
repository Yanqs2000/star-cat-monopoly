"""Fixed mothers with source-timed paw and shoulder gestures.

The source rectangles describe changing silhouettes, not a camera or a body
transform. Never scale or morph the face to those rectangles during a gesture.
All pixel coordinates below mark parts on the canonical density-two texture.
"""
import json
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw


def _cycle(values, time, period):
 """Periodic cubic angles: no halt at each intermediate source wing pose."""
 phase = (time % period)*len(values)/period
 index = math.floor(phase)
 u = phase-index
 a, b, c, d = [values[i % len(values)] for i in
                (index-1, index, index+1, index+2)]
 return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u)


def _unpremultiply(rgba):
 alpha = np.clip(rgba[:, :, 3:4], 0, 1)
 rgb = np.divide(rgba[:, :, :3], alpha,
                 out=np.zeros_like(rgba[:, :, :3]), where=alpha > 1e-8)
 return np.rint(np.concatenate((np.clip(rgb, 0, 1), alpha), axis=2)*255).astype(np.uint8)


def _paw(canonical, ox, oy, scale, density, root):
 source = json.loads((root/'public/hd-review/characters-22-23/source-timeline.json').read_text())
 timeline = next(s['timeline'] for s in source['sprites'] if s['symbol'] == 309)
 hand_y = [next(l['matrix'][5] for l in layers if l['depth'] == 3)
           for layers in timeline]
 rgba = np.asarray(canonical)
 yy, xx = np.indices(rgba.shape[:2], dtype=np.float32)
 x, y = (xx-ox)/scale, (yy-oy)/scale
 # The raised paw and its wrist only. The cheek, eyes, scarf and plaque are
 # outside this compact mesh; they retain the original mother's exact pixels.
 wx = np.clip((x-124)/12, 0, 1)
 wx = wx*wx*(3-2*wx)
 wx *= np.clip((177-x)/14, 0, 1)**2
 wy = np.sin(np.pi*np.clip((y-32)/69, 0, 1))**2
 weight = wx*wy
 active = weight > 1e-7
 premult = rgba.astype(np.float32)/255
 premult[:, :, :3] *= premult[:, :, 3:4]
 def sample(time):
  time %= len(hand_y)
  tick = math.floor(time)
  end = tick+1
  while end < len(hand_y) and hand_y[end] == hand_y[tick]: end += 1
  start = tick
  while start > 0 and hand_y[start-1] == hand_y[tick]: start -= 1
  start = max(start, end-3)
  fraction = max(0., (time-start)/(end-start))
  fraction = fraction*fraction*(3-2*fraction)
  value = hand_y[tick]+(hand_y[end % len(hand_y)]-hand_y[tick])*fraction
  delta = (value-hand_y[0])*density
  if abs(delta) < 1e-8: return canonical.copy()
  displacement = np.rint(delta*weight*32)/32
  moved = cv2.remap(premult, xx, yy-displacement, cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_CONSTANT)
  out = rgba.copy()
  out[active] = _unpremultiply(moved)[active]
  return Image.fromarray(out)
 return sample


def _wing_parts(npc, canonical, ox, oy, scale):
 rgba = np.asarray(canonical)
 rgb = rgba[:, :, :3].astype(np.int16)
 yy, xx = np.indices(rgba.shape[:2])
 x, y = (xx-ox)/scale, (yy-oy)/scale
 if npc == 'npc-5':
  # Purple bat wings; its yellow eyes/head, white ribbon and mummy stay fixed.
  color = (rgb[:, :, 0] > rgb[:, :, 1]+3) & (rgb[:, :, 2] > rgb[:, :, 1]+3)
  head = ((x-87)/25)**2+((y-45)/23)**2 < 1
  regions = [(x < 67) & (y < 63) & ~head,
             (x > 104) & (x < 181) & (y < 59) & ~head]
  pivots = [(64, 47), (108, 44)]
  angles = [0, -20, 10, 40, 65, 70, 65, 45, 15, -10, 0]
 elif npc == 'npc-10':
  color = rgb[:, :, 2] > rgb[:, :, 0]+3
  regions = [(x < 59) & (y > 43) & (y < 112),
             (x > 98) & (y > 43) & (y < 112)]
  pivots = [(53, 106), (102, 106)]
  angles = [0, 18, 50, 75, 50, 18]
 else:
  # Wing membranes are red/pink; the white fork belongs to the fixed body.
  color = (rgb[:, :, 0] > rgb[:, :, 1]+3) & (rgb[:, :, 0] > rgb[:, :, 2]+3)
  polygons = [[(-2, 47), (25, 45), (52, 66), (65, 86), (79, 107), (47, 110), (29, 102), (-2, 105)],
              [(160, 89), (173, 69), (195, 48), (219, 52), (221, 110), (190, 95), (171, 108), (155, 112)]]
  regions = []
  for polygon in polygons:
   region = Image.new('L', canonical.size)
   ImageDraw.Draw(region).polygon([(round(ox+a*scale), round(oy+b*scale)) for a, b in polygon], fill=255)
   regions.append(np.asarray(region) > 0)
  pivots = [(74, 104), (162, 104)]
  angles = [0, -20, 0, 35, 55, 25]
 masks = [];removal_masks=[]
 for region in regions:
  seed = (color & region & (rgba[:, :, 3] > 1)).astype(np.uint8)
  seed = cv2.morphologyEx(seed, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
  contours, _ = cv2.findContours(seed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
  filled = np.zeros(seed.shape, np.uint8)
  cv2.drawContours(filled, contours, -1, 1, cv2.FILLED)
  filled = cv2.dilate(filled, np.ones((3, 3), np.uint8))
  mask = (filled > 0) & region & (rgba[:, :, 3] > 0)
  if npc == 'npc-10':
   # Warm ear/hair pixels can touch the blue feather outline. Dilation must
   # never detach a strip of ear and send it round with the wing.
   eyes = (((x > 47) & (x < 75)) | ((x > 80) & (x < 109))) & (y > 62) & (y < 98)
   mask = region & (rgba[:, :, 3] > 0) & (rgb[:, :, 0] <= rgb[:, :, 2]+15) & ~eyes
  elif npc == 'npc-11':
   # The top fork prong occludes the membrane. A dilation of the wing's red
   # color seed must not claim the adjacent cool gray antialiased fork edge.
   fork = ((x > 152) & (x < 198) & (y > 85) & (y < 123) &
           (rgb[:, :, 0] <= rgb[:, :, 1]+8) &
           (rgb[:, :, 0] <= rgb[:, :, 2]+8) & (rgba[:, :, 3] > 0))
   fork = cv2.dilate(fork.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
   head = Image.new('L', canonical.size)
   ImageDraw.Draw(head).polygon([(round(ox+a*scale), round(oy+b*scale)) for a, b in
    [(54,-4),(177,-4),(177,48),(172,72),(163,91),(148,104),(133,111),(94,112),(78,106),(68,98),(58,84),(53,65)]], fill=255)
   # Own the complete wing silhouette, including neutral dark outline pixels.
   # Color-only seeds leave the old edge suspended after the membrane moves.
   mask = region & (rgba[:, :, 3] > 0) & ~fork & ~(np.asarray(head) > 0)
  removal_masks.append(mask.copy())
  # Isolated glints/grid dust are not a second piece of wing. Remove their
  # old alpha as well, otherwise it remains suspended beside the moving part.
  count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
  if count > 1:
   largest = 1+int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
   mask = labels == largest
  masks.append(mask)
 parts = []
 for mask in masks:
  part = rgba.copy()
  part[:, :, 3][~mask] = 0
  parts.append(Image.fromarray(part))
 fixed = Image.fromarray(((rgba[:, :, 3] > 0) & ~(removal_masks[0] | removal_masks[1])).astype(np.uint8)*255)
 pivots = [(ox+a*scale, oy+b*scale) for a, b in pivots]
 return parts, fixed, pivots, angles


def prepare_rig(npc, poses, density, canvas_rect, root, definition):
 """Sample the original inner playhead; world float is applied separately."""
 if npc not in ('npc-2', 'npc-5', 'npc-10', 'npc-11'):
  raise ValueError(f'No fixed gesture rig for {npc}')
 canonical = poses[0].convert('RGBA').copy()
 scale = density/2
 bbox = canonical.getbbox()
 ox, oy = bbox[0]-scale, bbox[1]-scale
 if npc == 'npc-2': return _paw(canonical, ox, oy, scale, density, root)
 parts, fixed, pivots, angles = _wing_parts(npc, canonical, ox, oy, scale)
 period = len(definition['framePoseIndicesZeroBased'])
 def sample(time):
  angle = _cycle(angles, time, period)
  out = Image.new('RGBA', canonical.size)
  for part, pivot, sign in zip(parts, pivots, (1, -1)):
   out.alpha_composite(part.rotate(sign*angle, resample=Image.Resampling.BICUBIC,
                                    center=pivot))
  # A solid character occludes its rear wings. Copy the fixed mother's RGBA
  # once (including edge coverage), rather than blending/repainting its face.
  out.paste(canonical, (0, 0), fixed)
  return out
 return sample
