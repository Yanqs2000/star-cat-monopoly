import json,sys,unittest
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
OUT=m.WORK/'reviews/batch-19'
class ApprovedNorthSkyGhostTests(unittest.TestCase):
 def test_actual_sky_has_no_disconnected_approved_outline(self):
  im=Image.open(OUT/'pilot-north-right-4x.png').convert('RGB')
  ghost=np.array(im.getpixel((320,372))).astype(int);sky=np.array(im.getpixel((500,375))).astype(int)
  self.assertLessEqual(int(np.abs(ghost-sky).max()),2,'Approved tile leaves a disconnected dark cloud outline at world1004,429 over native alpha0')
 def test_only_native_pixel_crop_replaces_approved_top_band(self):
  p=OUT/'approved-review-regions.json';self.assertTrue(p.exists(),'No explicit approved-top crop provenance')
  rows=json.loads(p.read_text());self.assertEqual(len(rows),4)
  for r in rows:
   if r['tileId'] not in ['r0c0','r0c1']:self.assertEqual(r['nativeTopCropPixels'],0);continue
   self.assertEqual(r['nativeTopCropPixels'],m.py(452)-m.py(420))
   src=Image.open(m.ROOT/'public/modern'/r['sourceUrl']).convert('RGBA');out=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA')
   self.assertTrue(np.array_equal(np.array(src.crop((0,r['nativeTopCropPixels'],src.width,src.height))),np.array(out)),'Approved retained RGBA must stay exact; no alpha editing')
 def test_original_four_approved_files_stay_byte_identical(self):
  s=json.loads((m.ROOT/'public/modern/hd-map/manifest.json').read_text())
  for r in s['mapRegions']:self.assertEqual(m.sha(m.ROOT/'public/modern'/r['path']),r['outputSha256'])
if __name__=='__main__':unittest.main()
