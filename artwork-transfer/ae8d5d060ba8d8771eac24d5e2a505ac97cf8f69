import sys,unittest,os,json
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
class BuildingGrass(unittest.TestCase):
 def test_old_coarse_backing_is_not_retained_outside_building(self):
  rid='west-terrain-fine-middle-base-r2' if os.environ.get('REPLAY_COARSE_BACKING') else 'west-terrain-fine-middle-base-r3';f=m.CACHE/rid;g=json.loads((f/'generation.json').read_text());a=Image.open(f/'assembled-candidate.png').convert('RGBA');b=Image.open(g['path']).convert('RGBA').resize(a.size,Image.Resampling.LANCZOS);x,y,w,h=[272,1744,16,16];box=(m.px(x)-m.px(112),m.py(y)-m.py(1552),m.px(x+w)-m.px(112),m.py(y+h)-m.py(1552));self.assertTrue(np.array_equal(np.array(a.crop(box)),np.array(b.crop(box))),'Unrelated coarse grass rectangle was retained outside the native platform')
if __name__=='__main__':unittest.main()
