import sys,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
F=m.CACHE/'pilot-curb-native-continuation-r1'
class Curb(unittest.TestCase):
 def test_complete_native_white_curb_is_not_cut_by_old_sky_mask(self):
  donor=np.array(Image.open(F/'native-donor.png').convert('RGBA'));out=np.array(Image.open(F/'assembled-candidate.png').convert('RGBA'))
  yy,xx=np.indices(donor.shape[:2]);wx=1008+xx/m.DENSITY;wy=440+yy/m.DENSITY
  white=(donor[:,:,:3].min(2)>220)&(wy>1184-.66*wx-12)&(wy<1184-.66*wx+10)
  self.assertGreater(int(white.sum()),1000)
  self.assertGreaterEqual(int(out[:,:,3][white].min()),240,'Old source-sky masking must not erase the generated curb body')
 def test_sky_has_no_detached_old_curb_and_cyan10_is_retained(self):
  a=np.array(Image.open(F/'before.png').convert('RGBA'));b=np.array(Image.open(F/'assembled-candidate.png').convert('RGBA'))
  self.assertTrue(np.array_equal(a[180:340,320:550],b[180:340,320:550]))
  sky=np.array(Image.open(F/'sky-selection.png'))>0
  self.assertEqual(int(b[:,:,3][sky].max()),0,'Reuse native sky outside the complete curb; old detached white fragments must not remain')
 def test_native_curb_has_no_isolated_low_alpha_pixels(self):
  self.assertEqual(native_alpha_audit(Image.open(F/'assembled-candidate.png'))['enclosedLowAlphaPixels'],0)
if __name__=='__main__':unittest.main()
