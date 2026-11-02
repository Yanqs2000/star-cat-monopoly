from pathlib import Path
import json,unittest,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
class DaweiArtwork(unittest.TestCase):
 def test_native_two_feet_two_claws_and_welded_tail_metadata(self):
  p=ROOT/'src/modern/data/dawei-map-rig.json';self.assertTrue(p.exists(),'Dawei map pack missing')
  data=json.loads(p.read_text());r=data['characters'][0]
  self.assertEqual((r['id'],r['anatomy']),(8,'scorpion'))
  for facing,a in r['facings'].items():
   actor=a['actors'][0];self.assertEqual(len(actor['legs']),2);self.assertEqual(actor['arms'],[])
   self.assertEqual(len([e for e in actor['appendages']if e['kind']=='flipper']),2)
   tails=[e for e in actor['appendages']if e['part'].startswith('tail')];self.assertGreaterEqual(len(tails),3)
   for i,e in enumerate(tails):
    if i:self.assertEqual(e['parentPart'],tails[i-1]['part'])
    self.assertIn('hurtRotation',e)
   for expr in ['happy','sad','hurt']:self.assertIn('head-'+expr,actor['parts'])
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))
 def test_soot_shell_has_no_white_sunglasses_glints(self):
  p=ROOT/'src/modern/data/dawei-map-rig.json';self.assertTrue(p.exists(),'Dawei map pack missing')
  for a in json.loads(p.read_text())['characters'][0]['facings'].values():
   im=Image.open(ROOT/'public/modern'/a['actors'][0]['parts']['head-hurt']['url']).convert('RGBA')
   pixels=[max(r,g,b)for r,g,b,alpha in im.get_flattened_data()if alpha>128];self.assertLess(max(pixels),145)
if __name__=='__main__':unittest.main()
