from pathlib import Path
import json,hashlib,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class GuaikaArtwork(unittest.TestCase):
 def test_leg_bones_cannot_carry_jacket_triangles_or_white_gloves(self):
  import numpy as np
  for filename in ['guaika-map-rig.json','guaika-carnival.json']:
   rig=json.loads((ROOT/'src/modern/data'/filename).read_text())['characters'][0]
   for view in rig['facings'].values():
    for actor in view['actors']:
     for leg in actor['legs']:
      for name in [leg['upper'],leg['lower']]:
       part=actor['parts'][name];pixels=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA'))
       white=(pixels[:,:,:3].min(2)>190)&(pixels[:,:,3]>128)
       self.assertEqual(int(white.sum()),0,'a trouser leg cannot include the nearby white glove')
       self.assertEqual(part.get('reconstructedFrom'),'masters/role-11-clean-legs-r1.png','occluded black legs need complete cloth, not stretched pointed jacket pieces')

 def test_hurt_replacement_cannot_carry_a_blue_fragment_from_the_row_above(self):
  import numpy as np
  data=json.loads((ROOT/'src/modern/data/guaika-map-rig.json').read_text())
  part=data['characters'][0]['facings']['up-right']['actors'][0]['parts']['head-hurt']
  pixels=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')).astype(int)
  blue=(pixels[:,:,2]-pixels[:,:,0]>40)&(pixels[:,:,2]>pixels[:,:,1]*1.2)&(pixels[:,:,3]>128)
  # The bottle's antialiased glass rim retains a handful of cool edge pixels;
  # the separate blue row fragment was 189 solid pixels (visible above cap).
  self.assertLessEqual(int(blue.sum()),8,'the black hurt head must not include the blue bottom of the previous expression')

 def test_expression_rows_do_not_merge_when_alpha_fringes_connect_neighbouring_heads(self):
  import importlib.util
  from PIL import ImageDraw
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  self.assertTrue(hasattr(packing,'split_expression_views'),'authored expression row boundaries must survive connected alpha fringes')
  atlas=Image.new('RGBA',(80,60));draw=ImageDraw.Draw(atlas)
  for row in range(3):
   for col in range(4):draw.rectangle((col*20+4,row*20+3,col*20+15,row*20+16),fill=(row*80,20,50,255))
  draw.line((9,16,9,23),fill=(0,20,50,10))
  views=packing.split_expression_views(atlas,[0,20,40,60])
  self.assertEqual(len(views),12)
  for i,view in enumerate(views):self.assertEqual(view.getpixel((view.width//2,view.height//2))[0],i//4*80)

 def test_map_pack_is_independent_complete_biped_with_registered_expression_heads(self):
  path=ROOT/'src/modern/data/guaika-map-rig.json'
  self.assertTrue(path.exists(),'a complete separately packed Guaika rig is required')
  data=json.loads(path.read_text());rig=data['characters'][0]
  self.assertEqual(rig['id'],11);self.assertEqual(rig['anatomy'],'biped')
  self.assertEqual(data['activeIds'],[11])
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))
  # Complete gloves cross the old torso rectangle. Cutting there exposes a
  # straight amputated edge as soon as the independently moving hand lifts.
  source=Image.open(ROOT/'public/hd-review/characters-25/masters/role-11-neutral-r1.png').convert('RGBA')
  actor=data['characters'][0]['facings']['down-right']['actors'][0]
  hand=actor['parts']['rightHand']
  packed=Image.open(ROOT/'public/modern'/hand['url']).convert('RGBA')
  px=round(312-316+hand['pivot'][0]*rig['density']);py=round(625-620+hand['pivot'][1]*rig['density'])
  self.assertGreater(source.getpixel((312,625))[3],128)
  self.assertTrue(0<=px<packed.width and 0<=py<packed.height,'full glove must remain after separating it from the overlapping torso')
  self.assertEqual(packed.getpixel((px,py)),source.getpixel((312,625)))
  for facing,view in rig['facings'].items():
   actor=view['actors'][0];self.assertEqual(len(actor['legs']),2);self.assertEqual(len(actor['arms']),2)
   self.assertEqual(actor['parts']['body']['reconstructedFrom'],'masters/role-11-clean-torso-r1.png')
   for name in ['head','head-happy','head-sad','head-hurt']:
    self.assertIn(name,actor['parts'])
   for part in actor['parts'].values():self.assertIn('/role-11/',part['url'])
   for leg in actor['legs']:
    part=actor['parts'][leg['tip']]
    self.assertEqual(part.get('reconstructedFrom'),'masters/role-11-complete-shoes-r2.png','occluded shoes need a complete rounded surface when they move apart')
  for asset in data['runtimeImages']:
   p=ROOT/'public/modern'/asset['url']
   self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),asset['sha256'])
   with Image.open(p)as im:self.assertEqual(list(im.size),asset['pixelSize'])

if __name__=='__main__':unittest.main()
