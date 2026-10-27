import json,sys,unittest
from pathlib import Path
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-18'
class ApprovedEastEdgeUnderlayTests(unittest.TestCase):
 def test_east_neighbors_extend_beneath_approved_feather(self):
  regions=json.loads((OUT/'regions.json').read_text())
  for tid,y in [('r2c5',420),('r3c5',676)]:
   with self.subTest(tid=tid):
    r=next(r for r in regions if r['label']==tid)
    self.assertEqual(r['replacementRect'],[1120,y,272,256],'The fading accepted edge must reveal native art, not the legacy map')
    # Native grid rounds to the nearest texel; world geometry stays within half a texel.
    self.assertAlmostEqual(r['logicalRect'][0],1120,delta=0.5/4.3515625)
 def test_underlay_comes_from_unmodified_native_context(self):
  state=m.read();regions=json.loads((OUT/'regions.json').read_text())
  for tid,y in [('r2c5',420),('r3c5',676)]:
   with self.subTest(tid=tid):
    tile=next(t for t in state['tiles'] if t['id']==tid);r=next(r for r in regions if r['label']==tid)
    self.assertTrue(r.get('protectedPilotEastUnderlay'),'No left-context pixels were exported')
    rx,ry,rw,rh=tile['referenceRect'];raw=Image.open(m.ROOT/tile['selectedMaster']).convert('RGBA');raw=raw.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
    expected=raw.crop((m.px(1120)-m.px(rx),m.py(y)-m.py(ry),m.px(1152)-m.px(rx),m.py(y+256)-m.py(ry)))
    donor=next(a for a in state['repairs'] if a['id']=='approved-east-native-continuation-r1');drx,dry,drw,drh=donor['referenceRect'];dn=Image.open(m.ROOT/donor['files']['master.png']['path']).convert('RGBA').resize((m.px(drx+drw)-m.px(drx),m.py(dry+drh)-m.py(dry)),Image.Resampling.LANCZOS)
    bottom=min(y+256,732);part=dn.crop((0,m.py(y)-m.py(dry),m.px(1152)-m.px(1120),m.py(bottom)-m.py(dry)));expected.paste(part,(0,0))
    actual=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA').crop((0,0,m.px(1152)-m.px(1120),expected.height))
    self.assertTrue(np.array_equal(np.array(expected),np.array(actual)),'Underlay must preserve native RGBA, never paint or use the opaque approved assembly')
 def test_actual_renderer_clears_legacy_map_under_east_feather(self):
  b=json.loads((OUT/'native-alpha-browser-verification.json').read_text())
  self.assertEqual(b['legacyBaseCulling'].get('eastUnderlayZeroAlphaSamples'),[0,0],'Old 2x base remains visible through the approved east fade')
if __name__=='__main__':unittest.main()
