from pathlib import Path
import copy,importlib.util,json,shutil,tempfile,unittest
from unittest.mock import patch
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'

class JjmmArtwork(unittest.TestCase):
 def test_exported_carnival_rasters_move_and_wrap_without_a_larger_boundary_jump(self):
  for side in ['left','right']:
   frames=[]
   for frame in range(64):
    image=Image.open(ROOT/f'public/modern/hd-characters/characters-25/role-03/carnival-{side}-{frame}.webp').convert('RGBA');pixels=np.array(image).astype('float32');pixels[:,:,:3]*=pixels[:,:,3:]/255;frames.append(pixels)
   steps=[float(np.abs(a-b).mean())for a,b in zip(frames,frames[1:])];self.assertGreater(max(steps),.001)
   self.assertLessEqual(float(np.abs(frames[-1]-frames[0]).mean()),max(steps)*1.05,'the real paired raster sequence must close smoothly at its native loop boundary')

 def test_every_shoulder_is_registered_over_opaque_body_surface(self):
  rig=json.loads((ROOT/'src/modern/data/jjmm-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   for actor in view['actors']:
    part=actor['parts']['body'];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA');spine=actor['joints']['spine']
    for arm in actor['arms']:
     root=actor['joints'][arm['root']];x,y=[round((v-o+p)*rig['density'])for v,o,p in zip(root,spine,part['pivot'])];alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
     self.assertGreater(alpha,128,facing+'/'+actor['id']+'/'+arm['name']+': a moving arm cannot float outside its shoulder surface')

 def test_material_renderer_champion_preview_preserves_the_curl_identity(self):
  a=np.array(Image.open('/tmp/starcat-jjmm-jiajia-shuaige/role-3/material-renders/champion.png').convert('RGBA')).astype(int)
  gold=((a[:,:,0]>170)&(a[:,:,1]>110)&(a[:,:,0]-a[:,:,2]>90)&(a[:,:,1]-a[:,:,2]>60)&(a[:,:,3]>128)).sum()
  self.assertGreater(int(gold),100,'the two-actor renderer must not replace both heads with the first headwrap actor')

 def test_carnival_has_native_paired_placement_and_one_full_64_sample_cycle(self):
  path=ROOT/'src/modern/data/jjmm-carnival.json';self.assertTrue(path.exists(),'the paired carnival rig must be independently packed')
  data=json.loads(path.read_text());rig=data['characters'][0];self.assertEqual(rig['artworkSamples'],64)
  actors={a['id']:a for a in rig['facings']['down-right']['actors']}
  self.assertLess(actors['bandana']['joints']['neck'][0],actors['curl']['joints']['neck'][0]);self.assertLess(actors['bandana']['joints']['neck'][1],actors['curl']['joints']['neck'][1])
  for view in rig['facings'].values():
   self.assertEqual([a['id']for a in view['actors']],['bandana','curl'])
   for actor in view['actors']:
    p=actor['parts']['head'];a=np.array(Image.open(ROOT/'public/modern'/p['url']).convert('RGBA')).astype(int);a=a[:round(a.shape[0]*.45)]
    gold=((a[:,:,0]>170)&(a[:,:,1]>110)&(a[:,:,0]-a[:,:,2]>90)&(a[:,:,1]-a[:,:,2]>60)&(a[:,:,3]>128)).sum()
    if actor['id']=='curl':self.assertGreater(int(gold),100)
    else:self.assertEqual(int(gold),0,'the headwrap child must never inherit the golden-curl head')

 def test_expression_indices_use_whole_heads_from_a_four_row_atlas(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author=json.loads((REVIEW/'role-12-authoring.json').read_text());author['expressionAnchorMode']='neck'
  for view in author['facings']:
   view['actors'][0].update(expressionMaster='expressions.png',expressionLayout=[4,4],expressionAtlasIndices=list(range(4,16)),expressionNeckRows=[[12]*4]*3)
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);local=target/'review';local.mkdir();(local/'masters').symlink_to(REVIEW/'masters',target_is_directory=True);shutil.copy2(REVIEW/'source-index.json',local/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   image=Image.new('RGBA',(96,96));draw=ImageDraw.Draw(image)
   for row,color in enumerate(['red','lime','blue','yellow']):
    for col in range(4):draw.rectangle((col*24+4,row*24+4,col*24+19,row*24+19),fill=color)
   image.save(local/'expressions.png')
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',local):data=packing.build_role(author)
   actor=data['characters'][0]['facings']['down-right']['actors'][0]
   for name,color in [('head-happy',[0,255,0]),('head-sad',[0,0,255]),('head-hurt',[255,255,0])]:
    image=Image.open(target/'public/modern'/actor['parts'][name]['url']).convert('RGBA');pixels=np.array(image).astype(int);opaque=pixels[pixels[:,:,3]>128]
    self.assertTrue(np.all(np.abs(opaque[:,:3]-np.array(color))<3),'each expression index must select its complete head from the four-row atlas')

 def test_hidden_calf_uses_a_complete_same_identity_reference_surface(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author=json.loads((REVIEW/'role-02-authoring.json').read_text());leg=author['facings'][0]['actors'][0]['legs'][0]
  leg['surfaceDonors']={'lower':{'sourceMaster':'calf.png','sourcePolygon':[[0,0],[19,0],[19,99],[0,99]],'sourcePivot':[10,3],'sourceAxis':[0,34]}}
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);local=target/'review';local.mkdir();(local/'masters').symlink_to(REVIEW/'masters',target_is_directory=True);shutil.copy2(REVIEW/'source-index.json',local/'source-index.json');(target/'src/modern/data').mkdir(parents=True);Image.new('RGBA',(20,100),'lime').save(local/'calf.png')
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',local):data=packing.build_role(author)
   part=data['characters'][0]['facings']['down-right']['actors'][0]['parts'][leg['name']+'Shin'];a=np.array(Image.open(target/'public/modern'/part['url']).convert('RGBA')).astype(int);opaque=a[a[:,:,3]>128]
   self.assertTrue(np.all(opaque[:,1]>opaque[:,0]+100),'a calf hidden by the foot needs its complete donor surface')
   self.assertEqual(part['axis'],[0,34/author['density']]);self.assertEqual(part['reconstructedFrom'],'calf.png')
   self.assertLessEqual(part['height'],45,'bone surfaces must stop at their end joint; a separate palm/foot owns distal pixels')

 def test_each_body_closes_the_neck_surface_beneath_the_replacement_head(self):
  data=json.loads((ROOT/'src/modern/data/jjmm-map-rig.json').read_text());rig=data['characters'][0]
  for facing,view in rig['facings'].items():
   for actor in view['actors']:
    body=actor['parts']['body'];neck=actor['joints']['neck'];spine=actor['joints']['spine'];image=Image.open(ROOT/'public/modern'/body['url']).convert('RGBA');x=round((neck[0]-spine[0]+body['pivot'][0])*rig['density']);y=round((neck[1]-spine[1]+body['pivot'][1])*rig['density']);alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
    self.assertGreater(alpha,128,facing+'/'+actor['id']+': the complete neck must overlap the head rather than float beneath it')

 def test_reaction_heads_register_at_their_neck_instead_of_the_image_center(self):
  rig=json.loads((ROOT/'src/modern/data/jjmm-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   for actor in view['actors']:
    for name in ['head-happy','head-sad','head-hurt']:
     part=actor['parts'][name];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA');x,y=[round(v*rig['density'])for v in part['pivot']];alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
     self.assertGreater(alpha,128,facing+'/'+actor['id']+'/'+name+': expressions must keep opaque neck contact while changing facial outline')

 def test_four_direction_map_contains_both_twin_bipeds_and_all_reaction_heads(self):
  path=ROOT/'src/modern/data/jjmm-map-rig.json';self.assertTrue(path.exists(),'both children need a complete four-direction rig')
  data=json.loads(path.read_text());self.assertEqual(data['activeIds'],[3]);rig=data['characters'][0];self.assertEqual(rig['anatomy'],'paired')
  for view in rig['facings'].values():
   self.assertEqual({a['id']for a in view['actors']},{'curl','bandana'})
   for actor in view['actors']:
    self.assertEqual(len(actor['legs']),2);self.assertEqual(len(actor['arms']),2)
    for expression in ['head','head-happy','head-sad','head-hurt']:self.assertIn(expression,actor['parts'])
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))

 def test_packing_one_twin_cannot_absorb_the_other_twin_pixels(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author={'id':3,'name':'双人像素归属','anatomy':'paired','neutralMaster':'pair.png','layout':[2,2],'density':1,'mapAnchor':[0,0],'stridePx':18,'motionScale':.5,'facings':[]}
  image=Image.new('RGBA',(100,160));draw=ImageDraw.Draw(image)
  for i in range(4):
   x=i%2*50;y=i//2*80;actors=[]
   for who,left,color in [('curl',x,'lime'),('bandana',x+25,'red')]:
    draw.rectangle((left+3,y+10,left+21,y+65),fill=color)
    actors.append({'id':who,'sourcePolygon':[[left,y],[left+24,y],[left+24,y+79],[left,y+79]],'headPolygon':[[left,y],[left+24,y],[left+24,y+34],[left,y+34]],'bodyPolygon':[[left,y+35],[left+24,y+35],[left+24,y+79],[left,y+79]],'joints':{'neck':[left+12,y+30],'spine':[left+12,y+50]},'legs':[],'arms':[],'extras':[]})
   author['facings'].append({'origin':[x+25,y+70],'actors':actors})
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);local=target/'review';local.mkdir();image.save(local/'pair.png');shutil.copy2(REVIEW/'source-index.json',local/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',local):data=packing.build_role(author)
   for view in data['characters'][0]['facings'].values():
    for actor,channel in zip(view['actors'],[1,0]):
     for part in actor['parts'].values():
      a=np.array(Image.open(target/'public/modern'/part['url']).convert('RGBA')).astype(int);opaque=a[a[:,:,3]>128]
      self.assertTrue(np.all(opaque[:,channel]>opaque[:,1-channel]+100),'edge recovery must stay inside this actor ownership contour')

 def test_each_twin_keeps_its_own_complete_head_and_expression_donor(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author=json.loads((REVIEW/'role-12-authoring.json').read_text());author.update(id=3,name='吉吉&米米',anatomy='paired')
  for view in author['facings']:
   first=view['actors'][0];second=copy.deepcopy(first);first['id']='curl';second['id']='bandana';view['actors']=[first,second]
   for actor,who in [(first,'curl'),(second,'bandana')]:
    actor.update(headMaster=who+'.png',headLayout=[4,1],expressionMaster=who+'-expressions.png',expressionCellRects=[[c*24,r*24,(c+1)*24,(r+1)*24]for r in range(3)for c in range(4)],expressionNeckRows=[[12]*4]*3)
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);local=target/'review';local.mkdir();(local/'masters').symlink_to(REVIEW/'masters',target_is_directory=True);shutil.copy2(REVIEW/'source-index.json',local/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   for who,color in [('curl','lime'),('bandana','red')]:
    for suffix,rows in [('',1),('-expressions',3)]:
     image=Image.new('RGBA',(96,24*rows));draw=ImageDraw.Draw(image)
     for r in range(rows):
      for c in range(4):draw.rectangle((c*24+4,r*24+4,c*24+19,r*24+19),fill=color)
     image.save(local/(who+suffix+'.png'))
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',local):data=packing.build_role(author)
   actors=data['characters'][0]['facings']['down-right']['actors']
   for actor,channel in zip(actors,[1,0]):
    for name in ['head','head-happy','head-sad','head-hurt']:
     part=actor['parts'][name];pixels=np.array(Image.open(target/'public/modern'/part['url']).convert('RGBA')).astype(int);opaque=pixels[pixels[:,:,3]>128]
     self.assertTrue(np.all(opaque[:,channel]>opaque[:,1-channel]+100),actor['id']+' must not inherit the other twin or the global head donor')

if __name__=='__main__':unittest.main()
