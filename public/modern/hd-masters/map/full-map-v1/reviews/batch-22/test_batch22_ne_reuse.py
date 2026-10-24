import json,sys,os,unittest
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews'/os.environ.get('HD_REVIEW_BATCH','batch-22')
CORNER=[1120,420,32,32];ROAD=[1056,472,96,64]
def native_approved(rect):
 meta=json.loads((m.ROOT/'public/modern/hd-masters/map/region-11-9-v2/masters.json').read_text());r=next(r for r in meta['tiles'] if r['tile']=='r0c1');p=m.ROOT/r['sourcePath'];assert m.sha(p)==r['sourceSha256']
 raw=Image.open(p).convert('RGBA');n=round(288*m.DENSITY);raw=raw.resize((n,n),Image.Resampling.LANCZOS);ox=round((256-16)*m.DENSITY);oy=round(-16*m.DENSITY);x,y,w,h=rect
 return raw.crop((m.px(x)-ox,m.py(y)-oy,m.px(x+w)-ox,m.py(y+h)-oy))
def exported(label,rect):
 row=next(r for r in json.loads((OUT/'regions.json').read_text()) if r['label']==label);ox,oy,_,_=row['replacementRect'];x,y,w,h=rect;im=Image.open(m.ROOT/'public/modern'/row['url']).convert('RGBA')
 return im.crop((m.px(x)-m.px(ox),m.py(y)-m.py(oy),m.px(x+w)-m.px(ox),m.py(y+h)-m.py(oy)))
class NortheastNativeReuseTests(unittest.TestCase):
 def test_green30_surface_stays_from_existing_east_scene(self):
  baseline=Image.open(m.WORK/'reviews/batch-20/r2c5.webp').convert('RGBA')
  for rect in [[1136,440,16,12],[1136,472,16,8]]:
   x,y,w,h=rect;expected=baseline.crop((m.px(x)-m.px(1120),m.py(y),m.px(x+w)-m.px(1120),m.py(y+h)))
   self.assertTrue(np.array_equal(np.array(expected),np.array(exported('r2c5',rect))),'Native reuse introduced a new rectangular lighting phase in green30')
 def test_green30_actual_render_uses_one_scene(self):
  baseline=Image.open(m.WORK/'reviews/batch-20/r2c5.webp').convert('RGBA');im=Image.open(OUT/'pilot-north-east-corner-4x.png').convert('RGB')
  for x,y in [(1144,460),(1144,466)]:
   rgba=baseline.getpixel((m.px(x)-m.px(1120),m.py(y)));expected=np.array([round((rgba[i]*rgba[3]+[102,204,255][i]*(255-rgba[3]))/255) for i in range(3)]);actual=np.array(im.getpixel((400+4*(x-1152),400+4*(y-420)))).astype(int)
   self.assertLessEqual(int(np.abs(actual-expected).max()),3,'Faded approved edge mixes a second lighting phase into green30')
 def test_east_review_geometry_retains_lower_field(self):
  rows=json.loads((OUT/'approved-review-regions.json').read_text());parts=[r for r in rows if r.get('sourceTileId',r['tileId'])=='r0c1' and r.get('nativePixelCrop')==[0,m.py(480),1119,1119]]
  self.assertEqual(len(parts),1,'Only the green30 band may lose the east feather; lower approved field must retain full width')
 def test_corner_is_exact_two_native_sources(self):
  folder=m.WORK/'native-reuse/northeast-corner-v1';old=np.array(Image.open(folder/'old.png').convert('RGBA'));north=np.array(Image.open(folder/'north.png').convert('RGBA'));mask=np.array(Image.open(folder/'mask.png'))>0;expected=np.where(mask[:,:,None],north,old)
  self.assertTrue(np.array_equal(expected,np.array(exported('r2c5',CORNER))),'Corner must retain exact source RGBA, with green30 kept from old east scene')
  baseline=np.array(Image.open(m.WORK/'reviews/batch-20/r2c5.webp').convert('RGBA').crop((0,0,old.shape[1],old.shape[0])));self.assertTrue(np.array_equal(baseline,old))
  self.assertFalse(mask[m.py(440):,m.px(1136)-m.px(1120):].any())
 def test_whole_cyan10_uses_exact_approved_native_pixels(self):
  expected=native_approved([1120,472,32,64]);baseline=Image.open(m.WORK/'reviews/batch-20/r2c5.webp').convert('RGBA');expected.paste(baseline.crop((m.px(1136)-m.px(1120),m.py(472),m.px(1152)-m.px(1120),m.py(480))),(m.px(1136)-m.px(1120),0))
  self.assertTrue(np.array_equal(np.array(expected),np.array(exported('r2c5',[1120,472,32,64]))),'Cyan10 must use approved native pixels with neighboring green30 retained')
  rs=json.loads((OUT/'regions.json').read_text());self.assertEqual(len([r for r in rs if r['label']=='r2c4-cyan10-underlay']),1,'Whole original medallion native coverage is missing')
  self.assertTrue(np.array_equal(np.array(native_approved([1056,472,64,64])),np.array(exported('r2c4-cyan10-underlay',[1056,472,64,64]))))
 def test_approved_reuse_is_genuine_opaque_artwork(self):
  x,y,w,h=ROAD;src=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h));self.assertEqual(src.getchannel('A').getextrema(),(255,255));expected=np.array(native_approved(ROAD));self.assertTrue((expected[:,:,3]==255).all())
  row=next(r for r in json.loads((m.ROOT/'public/modern/hd-map/manifest.json').read_text())['mapRegions'] if r['tileId']=='r0c1');im=Image.open(m.ROOT/'public/modern'/row['path']).convert('RGBA');l,t,_,_=row['overlapPixels'];actual=np.array(im.crop((m.px(x)-m.px(896)+l,m.py(y)+t,m.px(x+w)-m.px(896)+l,m.py(y+h)+t)));visible=actual[:,:,3]>0
  self.assertTrue(np.array_equal(actual[:,:,:3][visible],expected[:,:,:3][visible]),'Accepted visible RGB differs from proposed native reuse')
 def test_actual_sky_probe_has_no_blue_rectangle(self):
  im=Image.open(OUT/'pilot-north-east-corner-4x.png').convert('RGB');rgb=np.array(im.getpixel((288,440))).astype(int);self.assertLessEqual(int(np.abs(rgb-[102,204,255]).max()),2,'World1124,430 is original sky but opaque blue context remains')
 def test_other_east_atlas_pixels_are_unchanged(self):
  a=np.array(Image.open(m.WORK/'reviews/batch-20/r2c5.webp').convert('RGBA'));b=np.array(Image.open(OUT/'r2c5.webp').convert('RGBA'));mask=np.zeros(a.shape[:2],bool)
  for x,y,w,h in [CORNER,[1120,472,32,64]]:mask[m.py(y):m.py(y+h),m.px(x)-m.px(1120):m.px(x+w)-m.px(1120)]=True
  self.assertFalse(np.any(np.any(a!=b,axis=2)&~mask),'Unrelated east context or completed map core changed')
if __name__=='__main__':unittest.main()
