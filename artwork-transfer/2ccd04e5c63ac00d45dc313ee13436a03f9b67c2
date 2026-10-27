import sys,unittest,json,os
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-25'
class DrawReplacement(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows=(json.loads((OUT/'regions.json').read_text())+json.loads((OUT/'approved-review-regions.json').read_text())) if os.environ.get('REPLAY_UNCARVED') else json.loads((OUT/'draw-regions.json').read_text())
 def test_source_rgba_crops_exact(self):
  for r in self.rows:
   if 'sourcePixelCrop' not in r:continue
   a=Image.open(m.ROOT/'public/modern'/r['sourceUncarvedUrl']).convert('RGBA');b=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');self.assertTrue(np.array_equal(np.array(a.crop(tuple(r['sourcePixelCrop']))),np.array(b)));self.assertEqual(m.sha(m.ROOT/'public/modern'/r['sourceUncarvedUrl']),r['sourceUncarvedSha256'])
 def test_no_prior_pixels_under_replacement(self):
  def box(r):
   x,y,w,h=r['logicalRect'];return [round((x-640)*m.DENSITY),round((y-420)*m.DENSITY),round((x+w-640)*m.DENSITY),round((y+h-420)*m.DENSITY)]
  for patch in [r for r in self.rows if r.get('drawAfterApproved') and not r.get('spriteOnBase')]:
   x,y,c,d=box(patch)
   for r in self.rows:
    if r is patch or r.get('spriteOnBase'):continue
    a,b,e,f=box(r);self.assertFalse(min(c,e)>max(x,a) and min(d,f)>max(y,b),r.get('label',r.get('tileId')))
 def test_native_alpha_preserved(self):
  for r in self.rows:
   if not r.get('drawAfterApproved'):continue
   if r.get('spriteOnBase'):
    a=Image.open(m.ROOT/r['sourcePropPath']).convert('RGBA');b=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');self.assertTrue(np.array_equal(np.array(a),np.array(b)));continue
   repair=next(p for p in m.read()['repairs'] if p['id']==r.get('sourceUncarvedLabel',r['label']));a=Image.open(m.ROOT/repair['files']['assembled.png']['path']).convert('RGBA');a=a.crop(tuple(r['sourcePixelCrop'])) if 'sourcePixelCrop' in r else a;b=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');self.assertTrue(np.array_equal(np.array(a),np.array(b)))
 def test_patches_are_ground_in_original(self):
  original=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA')
  for rid,rect in [('southwest-curb-whole-joint-r1',[584,872,192,192]),('southeast-road-whole-joint-r1',[1040,868,240,240])]:
   x,y,w,h=rect;self.assertEqual(original.crop((x,y,x+w,y+h)).getchannel('A').getextrema(),(255,255));r=next(r for r in self.rows if r.get('label')==rid);self.assertTrue(r['drawAfterApproved'])
if __name__=='__main__':unittest.main()
