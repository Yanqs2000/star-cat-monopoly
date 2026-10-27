import sys,runpy,unittest,os,json
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
count=runpy.run_path(str(m.CACHE/'batch25-count-trees.py'))['count'];F=m.CACHE/'batch25-inputs/building-count'
class Trees(unittest.TestCase):
 def test_original_has_five_trees(self):self.assertEqual(len(count(Image.open(F/'original.png'),1)),5)
 def test_candidate_has_five_trees(self):
  p=F/'before.png' if os.environ.get('REPLAY_THREE_TREES') else m.WORK/'reviews/batch-25/five-trees-whole-4x.png';density=m.DENSITY if os.environ.get('REPLAY_THREE_TREES') else 4;self.assertEqual(len(count(Image.open(p),density)),5,'Candidate lost two original cone trees')
 def test_existing_three_trees_exact(self):
  a=Image.open(F/'before.png').convert('RGBA');b=Image.open(F/'after-base.png').convert('RGBA');rows=count(a,m.DENSITY);self.assertEqual(len(rows),3)
  for r in rows:
   aa=np.array(a.crop(tuple(r['bounds']))).astype(int);bb=np.array(b.crop(tuple(r['bounds'])));mask=(aa[:,:,0]<65)&(aa[:,:,1]>90)&(aa[:,:,1]>2*aa[:,:,0])&(aa[:,:,2]<85)
   from hd_map_seams import _alpha_components
   ys,xs=max(_alpha_components(mask),key=lambda p:len(p[0]));core=np.zeros(mask.shape,bool)
   for y in np.unique(ys):core[y,xs[ys==y].min():xs[ys==y].max()+1]=True
   self.assertTrue(np.array_equal(aa[core],bb[core]),'Original cone body pixels changed; grass around its bounding box is not part of the prop')
 def test_only_two_restored_components(self):
  a=count(Image.open(F/'before.png'),m.DENSITY);b=count(Image.open(m.WORK/'reviews/batch-25/five-trees-whole-4x.png'),4);self.assertEqual(len(b)-len(a),2)
if __name__=='__main__':unittest.main()
