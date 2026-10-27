import sys,runpy,unittest,os,json
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
count=runpy.run_path(str(m.CACHE/'batch24-count-trees.py'))['count'];F=m.CACHE/'batch24-inputs/building-count'
class Trees(unittest.TestCase):
 def test_original_has_five_trees(self):self.assertEqual(len(count(Image.open(F/'original.png'),1)),5)
 def test_candidate_has_five_trees(self):
  p=F/'before.png' if os.environ.get('REPLAY_THREE_TREES') else m.WORK/'reviews/batch-24/five-trees-whole-4x.png';density=m.DENSITY if os.environ.get('REPLAY_THREE_TREES') else 4;self.assertEqual(len(count(Image.open(p),density)),5,'Candidate lost two original cone trees')
 def test_existing_three_trees_exact(self):
  a=Image.open(F/'before.png').convert('RGBA');b=Image.open(F/'after-base.png').convert('RGBA');rows=count(a,m.DENSITY);self.assertEqual(len(rows),3)
  for r in rows:self.assertTrue(np.array_equal(np.array(a.crop(tuple(r['bounds']))),np.array(b.crop(tuple(r['bounds'])))))
 def test_only_two_restored_components(self):
  a=count(Image.open(F/'before.png'),m.DENSITY);b=count(Image.open(m.WORK/'reviews/batch-24/five-trees-whole-4x.png'),4);self.assertEqual(len(b)-len(a),2)
if __name__=='__main__':unittest.main()
