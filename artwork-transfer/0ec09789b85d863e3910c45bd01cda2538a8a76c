import sys,json,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-25';results=[]
class CanvasCoverage(unittest.TestCase):
 def test_visible_letterbox_points_use_native_source(self):
  rows=json.load(open(OUT/'draw-regions.json'));shot=Image.open(OUT/'terrain-main-whole-2x.png').convert('RGB')
  for x,y in [(352,1248),(224,2010)]:
   owners=[r for r in rows if not r.get('spriteOnBase') and r['logicalRect'][0]<=x<r['logicalRect'][0]+r['logicalRect'][2] and r['logicalRect'][1]<=y<r['logicalRect'][1]+r['logicalRect'][3]];self.assertEqual(len(owners),1);r=owners[0];ox,oy,_,_=r['logicalRect'];im=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');cx,cy=round((x-ox)*m.DENSITY),round((y-oy)*m.DENSITY);a=np.array(im.crop((cx-2,cy-2,cx+3,cy+3))).astype(float);rgb=a[:,:,:3]*(a[:,:,3:4]/255)+np.array([102,204,255])*(1-a[:,:,3:4]/255);actual=np.array(shot.getpixel((round(700+2*(x-200)),round(800+2*(y-1620)))));self.assertTrue(np.all(actual>=rgb.min((0,1))-3) and np.all(actual<=rgb.max((0,1))+3),f'Visible native region was not rendered: {x},{y} {actual}');results.append({'point':[x,y],'sourceLabel':r['label'],'actualRgb':actual.tolist()})
if __name__=='__main__':
 result=unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(CanvasCoverage));(OUT/'canvas-coverage-probes.json').write_text(json.dumps(results,indent=2)+'\n');sys.exit(not result.wasSuccessful())
