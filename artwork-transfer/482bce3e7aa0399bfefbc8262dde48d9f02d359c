import sys,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
F=m.CACHE/'green30-whole-native-r1'
class Green30(unittest.TestCase):
 def test_whole_disc_uses_one_native_source_without_vertical_lighting_cut(self):
  a=np.array(Image.open(F/'native-donor.png').convert('RGBA'));b=np.array(Image.open(F/'assembled-candidate.png').convert('RGBA'));mask=np.array(Image.open(F/'mask.png'))>0
  self.assertTrue(np.array_equal(a[mask],b[mask]),'Whole green30, its digits and lighting must come from one source across x1152')
 def test_other_artwork_including_cyan10_is_unchanged(self):
  a=np.array(Image.open(F/'before.png').convert('RGBA'));b=np.array(Image.open(F/'assembled-candidate.png').convert('RGBA'));mask=np.array(Image.open(F/'mask.png'))>0
  self.assertTrue(np.array_equal(a[~mask],b[~mask]))
if __name__=='__main__':unittest.main()
