import sys,json,unittest
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
class ForegroundBounds(unittest.TestCase):
 def test_existing_trees_match_recorded_reference_boxes(self):
  rows=json.loads((m.WORK/'reviews/batch-25/draw-regions.json').read_text())
  for name,target in [('west-round-tree-original-placement',[158,1603,236,1683]),('west-coast-tree-original-placement',[95,1321,187,1427])]:
   row=next(r for r in rows if r.get('label')==name);a=np.array(Image.open(m.ROOT/'public/modern'/row['url']).convert('RGBA'));ys,xs=np.where(a[:,:,3]>=200);x,y,_,_=row['logicalRect'];actual=np.array([x+xs.min()/m.DENSITY,y+ys.min()/m.DENSITY,x+(xs.max()+1)/m.DENSITY,y+(ys.max()+1)/m.DENSITY]);self.assertLessEqual(float(np.abs(actual-target).max()),1.25);self.assertTrue(row['spriteOnBase'])
if __name__=='__main__':unittest.main()
