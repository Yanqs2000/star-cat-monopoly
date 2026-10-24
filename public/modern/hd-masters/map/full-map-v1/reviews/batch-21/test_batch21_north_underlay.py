import json,sys,unittest
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-21'
class ApprovedNorthEdgeUnderlayTests(unittest.TestCase):
 def test_whole_north_feather_has_native_coverage(self):
  rs=json.loads((OUT/'regions.json').read_text())
  for x in range(648,1152,16):
   for y in [424,432,440,448]:
    covers=[r for r in rs if r['replacementRect'][0]<=x<r['replacementRect'][0]+r['replacementRect'][2] and r['replacementRect'][1]<=y<r['replacementRect'][1]+r['replacementRect'][3]]
    self.assertTrue(covers,f'Native art is missing beneath approved north fade at{x},{y}')
 def test_north_rgba_comes_from_its_native_context(self):
  rs=json.loads((OUT/'regions.json').read_text());s=m.read()
  for tid,rect in [('r1c3',[672,420,224,32]),('r1c4',[896,420,224,32])]:
   with self.subTest(tile=tid):
    matches=[r for r in rs if r.get('northUnderlaySourceTile')==tid];self.assertEqual(len(matches),1,'No source-native north strip exported')
    r=matches[0];self.assertEqual(r['replacementRect'],rect);t=next(t for t in s['tiles'] if t['id']==tid);rx,ry,rw,rh=t['referenceRect'];x,y,w,h=rect
    raw=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
    expected=raw.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)));actual=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA')
    self.assertTrue(np.array_equal(np.array(expected),np.array(actual)),'Retain native RGBA; opaque pilot donor or painted alpha is invalid')
 def test_renderer_clears_original_base_under_north(self):
  b=json.loads((OUT/'native-alpha-browser-verification.json').read_text());self.assertEqual(b['legacyBaseCulling']['northUnderlayZeroAlphaSamples'],[0,0],'Old 2x base leaks below native north fade')
if __name__=='__main__':unittest.main()
