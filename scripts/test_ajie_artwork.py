from pathlib import Path
import hashlib,importlib.util,json,unittest,tempfile,shutil
from unittest.mock import patch
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'

class AjieArtwork(unittest.TestCase):
 def test_carnival_catching_components_have_complete_reference_roots(self):
  rig=json.loads((ROOT/'src/modern/data/ajie-carnival.json').read_text())['characters'][0]
  for facing in rig['facings'].values():
   actor=facing['actors'][0]
   for extra in actor['appendages']:
    if extra['kind']!='flipper':continue
    part=actor['parts'][extra['part']];self.assertEqual(part.get('reconstructedFrom'),'masters/role-10-carnival-arms-reference-r1.png')
    image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA');x=round(part['pivot'][0]*rig['density']);y=round(part['pivot'][1]*rig['density'])
    self.assertGreater(image.getpixel((x,y))[3],128,'reference shoulder roots must contain real opaque surface')

 def test_reference_surface_keeps_only_its_own_pixels_and_registered_root(self):
  from PIL import ImageDraw
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author=json.loads((REVIEW/'role-10-authoring.json').read_text());extra=next(e for e in author['facings'][0]['actors'][0]['extras']if e['kind']=='flipper')
  extra.update(sourceMaster='surface.png',sourcePolygon=[[0,0],[5,0],[5,10],[0,10]],sourcePivot=[2,5],sourceScale=2)
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);review=target/'review';review.mkdir();(review/'masters').symlink_to(REVIEW/'masters',target_is_directory=True);shutil.copy2(REVIEW/'source-index.json',review/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   image=Image.new('RGBA',(32,32),'red');ImageDraw.Draw(image).rectangle((0,0,5,10),fill='lime');image.save(review/'surface.png')
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',review):result=packing.build_role(author)
   part=result['characters'][0]['facings']['down-right']['actors'][0]['parts'][extra['name']];a=np.array(Image.open(target/'public/modern'/part['url']).convert('RGBA')).astype(int);opaque=a[a[:,:,3]>128]
   self.assertTrue(np.all(opaque[:,1]>opaque[:,0]+100),'a reference component must not retain the old torso or pixels outside its authored contour')
   self.assertAlmostEqual(part['pivot'][0],4/author['density']);self.assertAlmostEqual(part['pivot'][1],10/author['density'])

 def test_champion_keeps_native_open_eyes_while_ui_portrait_stays_closed(self):
  import cv2
  def eyes(path):
   image=Image.open(path).convert('RGBA');box=image.getbbox();height=box[3]-box[1];a=np.array(image).astype(int)
   a=a[box[1]+round(height*.25):box[1]+round(height*.7),box[0]:box[2]]
   mask=((a[:,:,:3].max(2)<100)&(a[:,:,3]>128)).astype('uint8');_,_,stats,_=cv2.connectedComponentsWithStats(mask);area=(a[:,:,3]>128).sum()
   return sum(1 for x,y,w,h,count in stats[1:]if count>area*.002 and h/w>.9)
  base=ROOT/'public/modern'
  self.assertEqual(eyes(base/'assets/monthly/champions/10.png'),2)
  self.assertEqual(eyes(base/'assets/activities/face-10/1.png'),0)
  self.assertEqual(eyes(base/'hd-characters/characters-25/role-10/face.webp'),0)
  self.assertEqual(eyes(base/'hd-characters/characters-25/role-10/champion.webp'),2,'the original champion is frontal with open eyes; it must not reuse the closed map-happy head')

 def test_complete_head_donor_fills_the_surface_behind_an_occluding_hand(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author=json.loads((REVIEW/'role-10-authoring.json').read_text());author['headMaster']='masters/role-10-activity-heads-r1.png';author['headLayout']=[4,1]
  for view in author['facings']:view['headAtlasIndex']=0
  author['facings'][0]['actors'][0]['protectedPolygons']=[[[230,330],[250,330],[250,350],[230,350]]]
  author['facings'][2]['actors'][0]['protectedPolygons']=[[[1110,330],[1130,330],[1130,350],[1110,350]]]
  hand=next(e for e in author['facings'][0]['actors'][0]['extras']if e['kind']=='flipper'and e.get('front'));hand['overHead']=True
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);review=target/'review';review.mkdir();(review/'masters').symlink_to(REVIEW/'masters',target_is_directory=True);shutil.copy2(REVIEW/'source-index.json',review/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',review):result=packing.build_role(author)
   actor=result['characters'][0]['facings']['down-right']['actors'][0];part=actor['parts']['head'];neck=author['facings'][0]['actors'][0]['joints']['neck']
   image=Image.open(target/'public/modern'/part['url']).convert('RGBA');x=round(240-neck[0]+part['pivot'][0]*author['density']);y=round(340-neck[1]+part['pivot'][1]*author['density'])
   self.assertGreater(image.getpixel((x,y))[3],128,'removing an occluding hand must reveal a complete head surface, not a hole')
   self.assertGreater(actor['order'].index(hand['name']),actor['order'].index('head'),'a declared catching palm must draw over the complete jaw')
   rear=result['characters'][0]['facings']['up-left']['actors'][0];neck=author['facings'][2]['actors'][0]['joints']['neck']
   for name in ['head','head-happy','head-sad']:
    part=rear['parts'][name];image=Image.open(target/'public/modern'/part['url']).convert('RGBA');x=round(1120-neck[0]+part['pivot'][0]*author['density']);y=round(340-neck[1]+part['pivot'][1]*author['density'])
    self.assertGreater(image.getpixel((x,y))[3],128,'rear reactions must preserve the reconstructed head behind an occluder')

 def test_whole_flipper_roots_are_covered_by_the_clean_body_underpainting(self):
  data=json.loads((ROOT/'src/modern/data/ajie-map-rig.json').read_text());rig=data['characters'][0]
  for facing in rig['facings'].values():
   actor=facing['actors'][0];body=actor['parts'][actor['body']];origin=actor['joints']['spine'];image=Image.open(ROOT/'public/modern'/body['url']).convert('RGBA')
   for extra in actor['appendages']:
    if extra['kind']!='flipper':continue
    root=actor['joints'][extra['joint']];x=round((root[0]-origin[0]+body['pivot'][0])*rig['density']);y=round((root[1]-origin[1]+body['pivot'][1])*rig['density'])
    alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
    self.assertGreater(alpha,128,'the complete arm must rotate over opaque shoulder surface, not a transparent neck/shoulder notch')

 def test_up_right_sad_head_keeps_the_native_visible_tearful_eye(self):
  def cyan(image):
   a=np.array(image.convert('RGBA')).astype(int)
   return int(((a[:,:,2]>a[:,:,0]+10)&(a[:,:,1]>a[:,:,0]+3)&(a[:,:,3]>128)).sum())
  original=Image.open(ROOT/'public/modern/assets/characters/10/reactions/sad/up-right/45.png')
  self.assertGreater(cyan(original),0,'the original rear-right view has a visible side eye and tears')
  author=json.loads((REVIEW/'role-10-authoring.json').read_text())
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  heads=packing.split_expression_views(Image.open(REVIEW/author['expressionMaster']),author.get('expressionRowBounds'),author.get('expressionCellRects'))
  self.assertGreater(cyan(heads[7]),25,'up-right is a rear/side view with a visible eye, not a completely blank back head')

 def test_map_rig_has_a_tail_fin_and_no_invented_legs(self):
  path=ROOT/'src/modern/data/ajie-map-rig.json';self.assertTrue(path.exists(),'the independently packed Ajie map rig is required')
  data=json.loads(path.read_text());rig=data['characters'][0]
  self.assertEqual(data['activeIds'],[10]);self.assertEqual(rig['anatomy'],'floating')
  self.assertEqual(len(rig['facings']),4)
  for facing in rig['facings'].values():
   actor=facing['actors'][0];self.assertEqual(actor['legs'],[])
   self.assertFalse(any(name.endswith(('Foot','Thigh','Shin'))for name in actor['parts']))
   self.assertEqual(len([e for e in actor['appendages']if e['kind']=='tail']),1)
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))
  for item in data['runtimeImages']:
   path=ROOT/'public/modern'/item['url'];self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),item['sha256'])

if __name__=='__main__':unittest.main()
