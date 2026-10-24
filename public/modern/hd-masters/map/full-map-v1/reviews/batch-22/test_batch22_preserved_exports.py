import sys,unittest,json
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
class SignContextExportTest(unittest.TestCase):
 def check(self,tid,roi):
  t=next(t for t in m.read()['tiles'] if t['id']==tid);x,y,w,h=t['rect'];a,b,c,d=roi;box=(m.px(a)-m.px(x),m.py(b)-m.py(y),m.px(a+c)-m.px(x),m.py(b+d)-m.py(y))
  native=np.array(Image.open(m.WORK/'assembled'/f'{tid}.png').convert('RGBA').crop(box));export=np.array(Image.open(m.WORK/'reviews/batch-22'/f'{tid}.webp').convert('RGBA').crop(box));wrong=int(np.any(native!=export,axis=2).sum());results[tid]={'rect':roi,'wrongPixels':wrong};self.assertEqual(wrong,0,'Old sign context overwrote completed native map art')
 def test_completed_west_parcels_survive_sign_export(self):self.check('r5c4',[1088,1280,64,100])
 def test_completed_east_building_survives_sign_export(self):self.check('r4c6',[1392,1098,40,74])
 def test_accepted_title_pixels_are_preserved(self):
  state=m.read();r=next(r for r in state['repairs'] if r['id']=='tomorrow-city-glyph-native-reuse-r1');donor=Image.open(m.ROOT/r['files']['donor-canonical.png']['path']).convert('RGBA');export=Image.open(m.WORK/'reviews/batch-22/sign.webp').convert('RGBA');x,y,w,h=r['rect'];wrong=0
  for a,b,c,d in r['exportRects']:
   box=(m.px(a)-m.px(x),m.py(b)-m.py(y),m.px(a+c)-m.px(x),m.py(b+d)-m.py(y));wrong+=int(np.any(np.array(donor.crop(box))!=np.array(export.crop(box)),axis=2).sum())
  results['nativeTitle']={'windowCount':len(r['exportRects']),'wrongPixels':wrong};self.assertEqual(wrong,0,'Accepted native title glyph rectangles must remain exact')
 def test_complete_lane_stripe_comes_from_one_native_scene(self):
  from collections import deque
  r=next(r for r in m.read()['repairs'] if r['id']=='central-long-lane-complete-r1');x,y,w,h=r['rect'];im=Image.open(m.ROOT/r['files']['master.png']['path']).convert('RGBA').resize((m.px(x+w)-m.px(x),m.py(y+h)-m.py(y)),Image.Resampling.LANCZOS);a=np.array(im);white=(a[:,:,:3].min(axis=2)>220)&(np.ptp(a[:,:,:3].astype(int),axis=2)<25)
  sx=m.px(1200)-m.px(x);sy=m.py(1296)-m.py(y);self.assertTrue(white[sy,sx]);mask=np.zeros(white.shape,bool);todo=deque([(sy,sx)]);mask[sy,sx]=True
  while todo:
   by,bx=todo.popleft()
   for cy,cx in [(by-1,bx),(by+1,bx),(by,bx-1),(by,bx+1)]:
    if 0<=cy<white.shape[0] and 0<=cx<white.shape[1] and white[cy,cx] and not mask[cy,cx]:mask[cy,cx]=True;todo.append((cy,cx))
  self.assertGreater(int(mask.sum()),20000);export=Image.open(m.WORK/'reviews/batch-22/sign.webp').convert('RGBA');sx0,sy0=1088,1098;box=(m.px(x)-m.px(sx0),m.py(y)-m.py(sy0),m.px(x+w)-m.px(sx0),m.py(y+h)-m.py(sy0));b=np.array(export.crop(box));wrong=int(np.any(a!=b,axis=2)[mask].sum());results['completeWhiteStripe']={'connectedNativePaintPixels':int(mask.sum()),'wrongPixels':wrong};self.assertEqual(wrong,0,'No seam or preserved-title context may split native white stripe')
results={}
if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(SignContextExportTest);r=unittest.TextTestRunner().run(suite);(m.CACHE/'batch22-preserved-export-latest.json').write_text(json.dumps(results,indent=2)+'\n');sys.exit(not r.wasSuccessful())
