import json,sys,unittest
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-20'
class ApprovedSouthEdgeUnderlayTests(unittest.TestCase):
 def test_whole_south_feather_has_native_coverage(self):
  rs=json.loads((OUT/'regions.json').read_text())
  # West/east underlays already own the corners; every point along the rest
  # of this fading strip must also be covered, regardless of atlas splitting.
  for x in range(648,1152,16):
   for y in [904,912,920,928]:
    covers=[r for r in rs if r['replacementRect'][0]<=x<r['replacementRect'][0]+r['replacementRect'][2] and r['replacementRect'][1]<=y<r['replacementRect'][1]+r['replacementRect'][3]]
    self.assertTrue(covers,f'Legacy art is exposed at{x},{y} beneath the accepted south fade')
 def test_south_strip_rgba_comes_from_its_native_master(self):
  rs=json.loads((OUT/'regions.json').read_text());s=m.read()
  for tid,rect in [('r4c3',[672,900,224,32]),('r4c4',[896,900,224,32])]:
   with self.subTest(tile=tid):
    candidates=[r for r in rs if r.get('southUnderlaySourceTile')==tid]
    self.assertEqual(len(candidates),1,'No native south strip was exported')
    r=candidates[0];self.assertEqual(r['replacementRect'],rect)
    t=next(t for t in s['tiles'] if t['id']==tid);rx,ry,rw,rh=t['referenceRect'];x,y,w,h=rect
    raw=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
    expected=raw.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)))
    actual=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA')
    self.assertTrue(np.array_equal(np.array(expected),np.array(actual)),'Native RGBA must be preserved, no approved opaque donor or painted alpha')
 def test_renderer_clears_base_under_south_feather(self):
  b=json.loads((OUT/'native-alpha-browser-verification.json').read_text())
  self.assertEqual(b['legacyBaseCulling']['southUnderlayZeroAlphaSamples'],[0,0])
if __name__=='__main__':unittest.main()
