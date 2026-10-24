import sys,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
F=m.CACHE/'west-terrain-fine-north-base-r1'
class Road(unittest.TestCase):
 def same(self,r):
  x,y,w,h=r;box=(m.px(x)-m.px(0),m.py(y)-m.py(1264),m.px(x+w)-m.px(0),m.py(y+h)-m.py(1264));a=Image.open(F/'before.png').convert('RGBA').crop(box);b=Image.open(F/'assembled-candidate.png').convert('RGBA').crop(box);self.assertTrue(np.array_equal(np.array(a),np.array(b)),'Existing road/marking RGBA changed during grass material edit')
 def test_gray_road_between_objects_stays_native(self):self.same([268,1448,40,24])
 def test_blue30_and_red20_stay_native(self):
  for r in [[232,1384,72,64],[232,1480,72,56]]:self.same(r)
 def test_manhole_and_turn_stay_native(self):
  for r in [[184,1440,72,64],[128,1448,24,24]]:self.same(r)
if __name__=='__main__':unittest.main()
