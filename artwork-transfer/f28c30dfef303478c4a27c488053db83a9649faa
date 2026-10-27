import sys,unittest,os
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
class CleanTerrain(unittest.TestCase):
 def grass(self,rid,x,y):
  f=m.CACHE/rid;name='before.png' if os.environ.get('REPLAY_RETAINED_TREES') else 'assembled-candidate.png';ox,oy=([112,1552] if 'middle' in rid else [0,1264]);im=Image.open(f/name).convert('RGB');r,g,b=im.getpixel((m.px(x)-m.px(ox),m.py(y)-m.py(oy)));self.assertGreater(g-r,20,'Old tree trunk remains in terrain beneath the foreground sprite');self.assertGreater(g-b,50)
 def test_round_tree_is_removed_from_ground(self):self.grass('west-terrain-fine-middle-base-r3',198,1670)
 def test_coastal_tree_is_removed_from_ground(self):self.grass('west-terrain-fine-north-base-r1',141,1416)
if __name__=='__main__':unittest.main()
