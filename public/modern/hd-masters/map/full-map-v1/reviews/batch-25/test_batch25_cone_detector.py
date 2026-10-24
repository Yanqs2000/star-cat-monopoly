import sys,runpy,unittest
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
count=runpy.run_path(str(m.CACHE/'batch25-count-trees.py'))['count'];F=m.WORK/'reviews/batch-25/five-trees-whole-4x.png'
class ConeDetector(unittest.TestCase):
 def test_grass_cluster_is_not_a_cone(self):self.assertEqual(len(count(Image.open(F).crop((259,950,298,999)),4)),0)
 def test_original_sized_rear_cone_is_detected(self):self.assertEqual(len(count(Image.open(F).crop((972,545,1053,638)),4)),1)
if __name__=='__main__':unittest.main()
