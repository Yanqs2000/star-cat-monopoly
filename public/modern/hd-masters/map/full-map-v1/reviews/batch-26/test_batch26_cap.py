import sys,json,unittest
import numpy as np
from PIL import Image,ImageFilter
sys.path.insert(0,'scripts')
import produce_hd_map as m
from hd_map_seams import _alpha_components,native_alpha_audit
F=m.CACHE/'west-upper-terrain-cap-r2'
class Cap(unittest.TestCase):
 def setUp(self):
  self.old=np.array(Image.open(F/'before.png').convert('RGBA'))
  self.new=np.array(Image.open(F/'assembled-candidate.png').convert('RGBA'))
 def roi(self,a,rect):
  x,y,w,h=rect
  return a[m.py(y)-m.py(1048):m.py(y+h)-m.py(1048),m.px(x)-m.px(72):m.px(x+w)-m.px(72)]
 def test_complete_cloud_from_one_native_source(self):
  g=json.loads((F/'generation.json').read_text());raw=np.array(Image.open(g['path']).convert('RGBA').resize((self.new.shape[1],self.new.shape[0]),Image.Resampling.LANCZOS))
  masks=[]
  for a in [self.old,raw]:
   p=max(_alpha_components((a[:,:,3]>=200)&(a[:,:,2]>100)),key=lambda p:p.shape[1]);mask=np.zeros(a.shape[:2],bool);mask[tuple(p)]=True;masks.append(mask)
  old,new=masks;self.assertGreater((old&new).sum()/(old|new).sum(),.98)
  self.assertTrue(np.array_equal(raw[new],self.new[new]),'Cloud must come from one complete native source without interior shading cuts')
 def test_open_sky_channel_preserved(self):
  r=[112,1244,48,4];self.assertLessEqual(int(self.roi(self.new,r)[:,:,3].max()),2)
 def test_existing_road_and_cyan10_unchanged(self):
  r=[424,1264,32,32];self.assertTrue(np.array_equal(self.roi(self.old,r),self.roi(self.new,r)))
 def test_native_alpha_and_density(self):
  g=json.loads((F/'generation.json').read_text());im=Image.open(g['path']).convert('RGBA')
  self.assertGreaterEqual(min(im.width/384,im.height/248),4)
  self.assertEqual(native_alpha_audit(im)['enclosedLowAlphaPixels'],0)
  self.assertEqual(native_alpha_audit(Image.fromarray(self.new))['enclosedLowAlphaPixels'],0)
if __name__=='__main__':unittest.main()
