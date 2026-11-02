from pathlib import Path
import json,unittest,tempfile,importlib.util
from unittest.mock import patch
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
class AfeiArtwork(unittest.TestCase):
 def test_closed_body_can_combine_same_identity_torso_and_horse_surfaces_at_one_pivot(self):
  self.assertTrue(hasattr(packing,'reference_surfaces'),'centaur body requires closed pony barrel plus preserved upper torso')
  with tempfile.TemporaryDirectory()as folder:
   root=Path(folder);Image.new('RGBA',(6,6),(220,20,20,200)).save(root/'pony.png');Image.new('RGBA',(4,8),(210,140,100,255)).save(root/'torso.png')
   layers=[dict(sourceMaster='pony.png',sourcePolygon=[[0,0],[6,0],[6,6],[0,6]],sourcePivot=[3,3]),dict(sourceMaster='torso.png',sourcePolygon=[[0,0],[4,0],[4,8],[0,8]],sourcePivot=[2,6],at=[5,-1])]
   with patch.object(packing,'REVIEW',root):im,pivot,donor=packing.reference_surfaces(layers)
   self.assertEqual(im.size,(10,10));self.assertEqual(pivot,[3,7]);self.assertEqual(im.getpixel((3,7)),(220,20,20,200));self.assertEqual(im.getpixel((7,2)),(210,140,100,255));self.assertEqual(len(donor['sources']),2)
 def test_four_hooves_two_arms_and_all_native_facing_surfaces(self):
  p=ROOT/'src/modern/data/afei-map-rig.json';self.assertTrue(p.exists(),'Afei map pack missing');d=json.loads(p.read_text())
  r=d['characters'][0];self.assertEqual((r['id'],r['anatomy']),(9,'centaur'))
  for f in r['facings'].values():
   self.assertEqual(len(f['actors']),1);a=f['actors'][0];self.assertEqual(len(a['legs']),4);self.assertEqual(len(a['arms']),2)
   phases={l['name']:l['phase']for l in a['legs']};self.assertEqual(phases['leftFront'],phases['rightHind']);self.assertEqual(phases['rightFront'],phases['leftHind']);self.assertNotEqual(phases['leftFront'],phases['leftHind'])
   self.assertIn('sources',a['parts']['body']['donor']);self.assertTrue(all('head-'+e in a['parts']for e in ['happy','sad','hurt']))
  self.assertTrue(all(c['missingPixels']==0 for c in d['coverage']))

class SurfaceWidth(unittest.TestCase):
 def test_short_pony_bones_keep_native_width_instead_of_ball_shaped_joints(self):
  with tempfile.TemporaryDirectory()as folder:
   root=Path(folder);Image.new('RGBA',(6,6),(220,20,20,255)).save(root/'red.png')
   spec=dict(sourceMaster='red.png',sourcePolygon=[[0,0],[6,0],[6,6],[0,6]],sourcePivot=[3,1],sourceAxis=[2,4],sourceScale=2,sourceWidth=18)
   with patch.object(packing,'REVIEW',root):im,pivot,donor=packing.reference_surface(spec)
   self.assertEqual(im.size,(18,12));self.assertEqual(pivot,[9,2]);self.assertEqual(donor['axis'],[6,8])

class BowLayer(unittest.TestCase):
 def test_bow_is_attached_under_the_gripping_palm_and_above_the_body(self):
  data=json.loads((ROOT/'src/modern/data/afei-map-rig.json').read_text())
  for f in data['characters'][0]['facings'].values():
   actor=f['actors'][0];bow=next(e for e in actor['appendages']if e['part']=='bow');self.assertIn(bow['joint'],['leftHand','rightHand']);self.assertLess(actor['order'].index('body'),actor['order'].index('bow'));self.assertLess(actor['order'].index('bow'),actor['order'].index(bow['joint']));self.assertEqual(actor['order'].count('bow'),1)

if __name__=='__main__':unittest.main()
