import sys,runpy,unittest
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
count=runpy.run_path(str(m.CACHE/'batch24-count-trees.py'))['count'];OUT=m.WORK/'reviews/batch-24'
class OriginalTreeLayout(unittest.TestCase):
 def test_restored_tree_position_and_size_in_actual_scene(self):
  rows=count(Image.open(OUT/'five-trees-whole-4x.png'),4);boxes=[]
  for r in rows:
   a,b,c,d=r['bounds'];boxes.append(np.array([380+(a-700)/4,1688+(b-550)/4,380+(c-700)/4,1688+(d-550)/4]))
  self.assertEqual(len(boxes),5)
  for target in [[448,1687,468,1710],[416,1710,435,1738]]:
   target=np.array(target);actual=min(boxes,key=lambda p:np.linalg.norm(p-target));self.assertLessEqual(float(np.abs(actual-target).max()),1.25,f'Original tree geometry differs: {actual} versus {target}')
 def test_tree_feet_land_on_blue_platform(self):
  r=next(r for r in m.read()['repairs'] if r['id']=='yellow-building-empty-base-r3');im=Image.open(m.ROOT/r['files']['assembled.png']['path']).convert('RGB')
  for x,y in [(458,1715),(425,1745)]:
   rgb=im.getpixel((m.px(x)-m.px(392),m.py(y)-m.py(1640)));self.assertGreater(rgb[2],rgb[0],'Restored cone trunk would stand outside the blue base')
if __name__=='__main__':unittest.main()
