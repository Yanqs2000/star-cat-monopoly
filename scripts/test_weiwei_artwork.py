from pathlib import Path
import json,hashlib,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class WeiweiArtwork(unittest.TestCase):
 def test_braids_cannot_carry_a_second_old_white_wing_fragment(self):
  import numpy as np
  for filename in ['weiwei-map-rig.json','weiwei-carnival.json']:
   rig=json.loads((ROOT/'src/modern/data'/filename).read_text())['characters'][0]
   for view in rig['facings'].values():
    for actor in view['actors']:
     if 'braid'not in actor['parts']:continue
     pixels=np.array(Image.open(ROOT/'public/modern'/actor['parts']['braid']['url']).convert('RGBA')).astype(int)
     rgb=pixels[:,:,:3];cloth=(rgb.max(2)-rgb.min(2)<=28)&(rgb.min(2)>=20)&(pixels[:,:,3]>128)
     self.assertEqual(int(cloth.sum()),0,'the golden braid must not carry the occluding white feather that tears away when it rotates')

 def test_wing_roots_are_complete_and_covered_by_opaque_gown_at_every_view(self):
  for filename in ['weiwei-map-rig.json','weiwei-carnival.json']:
   d=json.loads((ROOT/'src/modern/data'/filename).read_text());rig=d['characters'][0]
   for facing,view in rig['facings'].items():
    for actor in view['actors']:
     body=actor['parts']['body'];cloth=Image.open(ROOT/'public/modern'/body['url']).convert('RGBA')
     for wing in [e for e in actor['appendages']if e['kind']=='wing']:
      part=actor['parts'][wing['part']]
      self.assertEqual(part.get('reconstructedFrom'),'masters/role-06-complete-wings-r1.png','folding a cropped occluded wing exposes a square torn root')
      root=actor['joints'][wing['joint']];spine=actor['joints']['spine']
      x=round((root[0]-spine[0]+body['pivot'][0])*rig['density']);y=round((root[1]-spine[1]+body['pivot'][1])*rig['density'])
      self.assertTrue(0<=x<cloth.width and 0<=y<cloth.height,f'{filename}/{facing}: wing root must attach inside the gown')
      self.assertGreater(cloth.getpixel((x,y))[3],128,f'{filename}/{facing}: wing root cannot pivot in empty background')

 def test_map_is_floating_with_independent_wings_braid_and_complete_expression_heads(self):
  path=ROOT/'src/modern/data/weiwei-map-rig.json'
  self.assertTrue(path.exists(),'Weiwei needs her own complete floating rig')
  d=json.loads(path.read_text());rig=d['characters'][0]
  self.assertEqual(rig['id'],6);self.assertEqual(rig['anatomy'],'floating')
  self.assertTrue(all(c['missingPixels']==0 for c in d['coverage']))
  for facing,view in rig['facings'].items():
   actor=view['actors'][0];self.assertEqual(actor['legs'],[],'map Weiwei must not gain human legs or shoes')
   self.assertTrue(any(a['kind']=='wing'for a in actor['appendages']))
   self.assertTrue(any(a['kind']=='tail'for a in actor['appendages']),'the nape braid must move independently')
   for name in ['head','head-happy','head-sad','head-hurt','body']:self.assertIn(name,actor['parts'])
   neutral=actor['parts']['head'];neutral_x=neutral['width']/rig['density']/2-neutral['pivot'][0]
   for expression in ['happy','sad','hurt']:
    part=actor['parts']['head-'+expression];center_x=part['width']/rig['density']/2-part['pivot'][0]
    self.assertLess(abs(center_x-neutral_x),3,'a long side lock must not move the replacement face away from the original neck')
   self.assertEqual(actor['parts']['body']['reconstructedFrom'],'masters/role-06-clean-torso-r2.png')
   if facing=='up-left':self.assertGreater(actor['order'].index('braid'),actor['order'].index('body'),'the back braid lies over the white gown')
  for asset in d['runtimeImages']:
   p=ROOT/'public/modern'/asset['url'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),asset['sha256'])
   with Image.open(p)as im:self.assertEqual(list(im.size),asset['pixelSize'])

if __name__=='__main__':unittest.main()
