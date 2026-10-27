import sys,json,unittest
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
F=m.WORK/'repairs/upper-cloud-complete-r2';OUT=m.WORK/'reviews/batch-25'
class Cloud(unittest.TestCase):
 def test_native_detail_and_alpha(self):
  im=Image.open(F/'master.png').convert('RGBA');self.assertGreaterEqual(min(im.width/456,im.height/184),4);self.assertLess(abs((im.width/im.height)/(456/184)-1),.01);audit=native_alpha_audit(im);self.assertEqual(audit['enclosedLowAlphaPixels'],0)
 def test_complete_sprite_not_quilt(self):
  a=Image.open(F/'assembled.png').convert('RGBA');raw=Image.open(F/'master.png').convert('RGBA');self.assertTrue(np.array_equal(np.array(a),np.array(raw.resize(a.size,Image.Resampling.LANCZOS))));a=np.array(a);body=a[:,:,3]>=200;ys,xs=np.where(body);self.assertGreater(xs.min(),2);self.assertLess(xs.max(),a.shape[1]-3);self.assertGreater(ys.min(),2);self.assertLess(ys.max(),a.shape[0]-3)
 def test_shape_footprint_retained(self):
  a=np.array(Image.open(F/'before.png').convert('RGBA'))[:,:,3]>=200;b=np.array(Image.open(F/'assembled.png').convert('RGBA'))[:,:,3]>=200;self.assertGreater((a&b).sum()/(a|b).sum(),.95)
  for mask in [a,b]:
   ys,xs=np.where(mask);self.assertGreater(xs.max()-xs.min(),400*m.DENSITY)
 def test_sky_frame_not_opaque(self):
  a=np.array(Image.open(F/'assembled.png').convert('RGBA'))[:,:,3];self.assertLessEqual(max(int(a[0].max()),int(a[-1].max()),int(a[:,0].max()),int(a[:,-1].max())),2)
 def test_all_old_solid_cloud_pixels_inside_replacement(self):
  a=np.array(Image.open(m.CACHE/'upper-cloud-complete-r1/before.png').convert('RGBA'))[:,:,3]>=200;keep=np.zeros(a.shape,bool);keep[m.py(116)-m.py(96):m.py(300)-m.py(96),m.px(1752)-m.px(1744):m.px(2208)-m.px(1744)]=True;self.assertFalse(np.any(a&~keep),'Old cloud body would remain outside the replacement frame')
 def test_whole_export_source_exact(self):
  rows=json.loads((OUT/'draw-regions.json').read_text());r=next(r for r in rows if r.get('label')=='upper-cloud-complete-r2');self.assertEqual(r['replacementRect'],[1752,116,456,184]);a=Image.open(F/'assembled.png').convert('RGBA');b=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');self.assertTrue(np.array_equal(np.array(a),np.array(b)));self.assertTrue(r['drawAfterApproved'])
if __name__=='__main__':unittest.main()
