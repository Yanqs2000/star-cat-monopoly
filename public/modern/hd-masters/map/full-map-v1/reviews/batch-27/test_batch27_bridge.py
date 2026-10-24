import sys,json,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts')
import produce_hd_map as m
from hd_map_seams import native_alpha_audit
F=m.CACHE/'south-bridge-material-r1'
class Bridge(unittest.TestCase):
 def setUp(self):
  self.old=np.array(Image.open(F/'before.png').convert('RGBA'))
  self.new=np.array(Image.open(F/'assembled-candidate.png').convert('RGBA'))
 def test_uniform_asphalt_lighting(self):
  def sample(a,x,y):return a[y:y+32,x:x+32,:3].mean()
  delta=abs(sample(self.new,380,560)-sample(self.new,1230,2))
  self.assertLess(delta,15,'Pale bridge end must join the same dark asphalt; no broad light/dark stripe')
 def test_original_disc_digits_colors_and_positions_retained(self):
  for x,y,w,h in [(900,240,175,110),(1120,95,150,105),(1340,0,180,45)]:
   self.assertTrue(np.array_equal(self.old[y:y+h,x:x+w],self.new[y:y+h,x:x+w]))
 def test_nonroad_river_cliff_and_prison_unchanged(self):
  for x,y,w,h in [(0,0,600,200),(1050,600,500,400),(0,800,400,250)]:
   self.assertTrue(np.array_equal(self.old[y:y+h,x:x+w],self.new[y:y+h,x:x+w]))
 def test_original_tree_foreground_retained(self):
  old=self.old[570:1000,500:950];new=self.new[570:1000,500:950]
  body=(old[:,:,1]>old[:,:,0].astype(float)*1.12)&(old[:,:,1]>old[:,:,2].astype(float)*1.3)
  self.assertTrue(np.array_equal(old[body],new[body]))
 def test_native_density_and_opacity(self):
  g=json.loads((F/'generation.json').read_text());im=Image.open(g['path']).convert('RGBA')
  self.assertGreaterEqual(min(im.width/384,im.height/248),4)
  self.assertEqual(native_alpha_audit(Image.fromarray(self.new))['enclosedLowAlphaPixels'],0)
if __name__=='__main__':unittest.main()
