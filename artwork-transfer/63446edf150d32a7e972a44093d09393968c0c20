import sys,unittest,json,os
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-24';F=m.WORK/'repairs/southwest-curb-whole-joint-r1'
class CornerOverlay(unittest.TestCase):
 def test_review_has_whole_patch_above_approved(self):
  rows=json.loads((OUT/'regions.json').read_text());r=next(r for r in rows if r['label']=='southwest-curb-whole-joint-r1');self.assertTrue(r['drawAfterApproved']);self.assertEqual(r['replacementRect'],[584,872,192,192])
 def test_cut_preserves_exact_source_pixels(self):
  a=np.array(Image.open(F/'before.png').convert('RGBA'));raw=Image.open(F/'master.png').convert('RGBA').resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS);mask=np.array(Image.open(F/'mask.png'))>0;out=np.array(Image.open(F/'assembled.png').convert('RGBA'));self.assertTrue(np.array_equal(out,np.where(mask[:,:,None],np.array(raw),a)));self.assertGreaterEqual(int(out[:,:,3].min()),240)
 def test_curb_no_longer_steps_back_at_join(self):
  def firstwhite(p,x):
   a=np.array(Image.open(p).convert('RGB'));ys=np.arange(m.py(918)-m.py(872),m.py(936)-m.py(872));v=a[ys,m.px(x)-m.px(584)].astype(int);valid=(v.min(1)>220)&(v.max(1)-v.min(1)<26);return ys[valid][0]
  before=firstwhite(F/'before.png',640)-firstwhite(F/'before.png',639);candidate=F/('before.png' if os.environ.get('REPLAY_OLD_CURB') else 'assembled.png');after=firstwhite(candidate,640)-firstwhite(candidate,639);self.assertLess(before,-8);self.assertGreaterEqual(after,-2);self.assertLessEqual(after,6)
 def test_cut_and_original_bounds(self):
  ev=json.loads((F/'evaluation.json').read_text());self.assertTrue(ev['passed']);self.assertTrue(all(v['meanRgbDifference']<=12 and v['p95RgbDifference']<=40 for v in ev['seams']));original=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA');self.assertEqual(original.crop((584,872,776,1064)).getchannel('A').getextrema(),(255,255))
 def test_working_tiles_unchanged(self):
  for t in m.read()['tiles']:self.assertEqual(m.sha(m.WORK/'assembled'/f"{t['id']}.png"),m.sha(m.CACHE/'batch24-before/assembled'/f"{t['id']}.png"))
if __name__=='__main__':unittest.main()
