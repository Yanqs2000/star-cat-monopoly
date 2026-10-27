import json,unittest
import numpy as np
from PIL import Image
from verify_full_hd_map_assets import MANIFEST,PUBLIC,ROOT,replay_patch

class FullMapPackage(unittest.TestCase):
 def test_north_crossing_markings_retain_original_paint_silhouettes(self):
  manifest=json.loads(MANIFEST.read_text())
  with Image.open(PUBLIC/manifest['baseMap']['path']) as image:
   for name,(x,y,w,h) in [('upper',(1120,820,80,70)),('lower',(1140,902,70,62))]:
    with self.subTest(marking=name):
     actual=np.array(image.crop((x*2,y*2,(x+w)*2,(y+h)*2)).convert('RGB').resize((w,h),Image.Resampling.LANCZOS)).astype(int)
     expected=np.array(Image.open(PUBLIC/f'hd-masters/map/full-map-v1/reviews/batch-30/{name}-original-stencil.png'))>0
     white=(actual.min(2)>210)&(actual.max(2)-actual.min(2)<35)
     self.assertGreaterEqual(float((white&expected).sum()/expected.sum()),.90)

 def test_north_crossing_arrow_leaves_no_paint_at_the_old_misplaced_position(self):
  manifest=json.loads(MANIFEST.read_text())
  with Image.open(PUBLIC/manifest['baseMap']['path']) as image:
   actual=np.array(image.crop((1157*2,945*2,1191*2,956*2)).convert('RGB').resize((34,11),Image.Resampling.LANCZOS)).astype(int)
   self.assertLessEqual(int(((actual.min(2)>210)&(actual.max(2)-actual.min(2)<35)).sum()),4)

 def test_west_cyan_disc_outline_has_no_horizontal_join_step(self):
  manifest=json.loads(MANIFEST.read_text())
  with Image.open(PUBLIC/manifest['baseMap']['path']) as image:
   rgb=image.convert('RGB');edges=[]
   for y in [1551,1551.5,1552,1552.5,1553]:
    edge=[]
    for px in range(580,680):
     r,g,b=rgb.getpixel((px,int(y*2)))
     if b>r+30 and g>r+15 and b>60:edge.append(px/2)
    self.assertTrue(edge)
    edges.append(edge[0])
   self.assertLessEqual(max(np.diff(edges)),.9,
    'Cyan disc rim jumps across the previous y=1552 atlas join')

 def test_south_bridge_upper_curb_preserves_original_width(self):
  manifest=json.loads(MANIFEST.read_text())
  with Image.open(PUBLIC/manifest['baseMap']['path']) as image:
   rgb=image.convert('RGB')
   for x,expected_y in [(1420,1901),(1430,1895),(1440,1887)]:
    edge=[]
    for y in range(expected_y-8,expected_y+30):
     p=rgb.getpixel((x*2,y*2))
     if max(p)-min(p)<45 and sum(p)/3>90:edge.append(y)
    self.assertTrue(edge, f'No bridge edge near {x},{expected_y}')
    self.assertLessEqual(abs(edge[0]-expected_y),4,
     f'Bridge upper edge at x={x} moved from {expected_y} to {edge[0]}')

 def test_complete_curb_is_visible_without_the_legacy_base(self):
  manifest=json.loads(MANIFEST.read_text())
  with Image.open(PUBLIC/manifest['baseMap']['path']) as image:
   rgba=image.convert('RGBA')
   for x,y in [(1054,489),(1080,472),(1104,456)]:
    pixel=rgba.getpixel((x*2,y*2))
    self.assertGreaterEqual(pixel[3],240)
    self.assertGreaterEqual(min(pixel[:3]),180)

 def test_overview_preserves_native_fade_underlay_composition(self):
  manifest=json.loads(MANIFEST.read_text());rows=json.loads((ROOT/manifest['recipe']['sourceDrawGraph']).read_text())
  # The approved pilot fades over its native continuation, not empty sky.
  expected=np.array(replay_patch(rows,640,500)).astype(int)
  with Image.open(PUBLIC/manifest['baseMap']['path']) as image:
   actual=np.array(image.crop((1280,1000,1344,1064)).convert('RGBA')).astype(int)
  self.assertLessEqual(int(np.abs(actual-expected).max()),2)

if __name__=='__main__':unittest.main()
