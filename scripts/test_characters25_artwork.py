from pathlib import Path
import importlib.util,unittest
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]

class Characters25ArtworkTest(unittest.TestCase):
 def test_boot_surface_is_owned_by_the_boot_and_never_by_a_rotating_leg(self):
  import json,numpy as np
  for data,author in [('aniu-map-rig.json','role-02-authoring.json'),('aniu-carnival.json','role-02-carnival-authoring.json')]:
   rig=json.loads((ROOT/'src/modern/data'/data).read_text())['characters'][0]
   authored=json.loads((ROOT/'public/hd-review/characters-25'/author).read_text())
   for facing,description in zip(rig['facings'].values(),authored['facings']):
    actor=facing['actors'][0]
    legs=description['actors'][0]['legs']
    boot=Image.new('L',(1774,887))
    for leg in legs:ImageDraw.Draw(boot).polygon([tuple(p)for p in leg['footPolygon']],fill=255)
    boot=np.array(boot)
    for leg in legs:
     for suffix,joint in [('Thigh','hip'),('Shin','knee')]:
      part=actor['parts'][leg['name']+suffix]
      with Image.open(ROOT/'public/modern'/part['url'])as image:alpha=np.array(image.convert('RGBA'))[:,:,3]
      y,x=np.where(alpha>128);gx=np.round(x+leg[joint][0]-part['pivot'][0]*rig['density']).astype(int);gy=np.round(y+leg[joint][1]-part['pivot'][1]*rig['density']).astype(int)
      self.assertEqual(int((boot[gy,gx]>0).sum()),0,'old boot pixels rotate into a visible extra toe when left inside the calf or thigh')
    for i,leg in enumerate(legs[:-1]):
     front=Image.new('L',(1774,887))
     for other in legs[i+1:]:ImageDraw.Draw(front).polygon([tuple(p)for p in other['footPolygon']],fill=255)
     p=actor['parts'][leg['name']+'Foot']
     if 'donor'in p:continue
     with Image.open(ROOT/'public/modern'/p['url'])as image:alpha=np.array(image.convert('RGBA'))[:,:,3]
     y,x=np.where(alpha>128);gx=np.round(x+leg['ankle'][0]-p['pivot'][0]*rig['density']).astype(int);gy=np.round(y+leg['ankle'][1]-p['pivot'][1]*rig['density']).astype(int)
     self.assertEqual(int((np.array(front)[gy,gx]>0).sum()),0,'the far boot cannot carry an occluding near-boot fragment')
     own=Image.new('L',(1774,887));ImageDraw.Draw(own).polygon([tuple(p)for p in leg['footPolygon']],fill=255)

 def test_occluded_map_far_boot_reuses_one_complete_same_view_boot(self):
  import json,numpy as np
  r=ROOT/'public/hd-review/characters-25';a=json.loads((r/'role-02-authoring.json').read_text());rig=json.loads((ROOT/'src/modern/data/aniu-map-rig.json').read_text())['characters'][0]
  p=rig['facings']['up-right']['actors'][0]['parts']['leftFoot']
  self.assertEqual(p.get('donor',{}).get('leg'),'right','a cropped occluded far boot has an exposed pointed edge when it steps away')
  actor=a['facings'][3]['actors'][0];source=next(l for l in actor['legs']if l['name']=='right');b=self.builder()
  master=Image.open(r/a['neutralMaster']).convert('RGBA');view=b.split_views(master,*a['layout'])[3];rect=view.info['masterRect'];pose=Image.new('RGBA',master.size);pose.alpha_composite(view,rect[:2]);image=b.masked(pose,b.polygon(master.size,source['footPolygon']));image=image.crop(image.getbbox());scale=p['donor']['scale'];image=image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.LANCZOS);image=image.crop(image.getbbox())
  with Image.open(ROOT/'public/modern'/p['url'])as packed:actual=np.array(packed.convert('RGBA'))
  self.assertEqual(actual.shape,np.array(image).shape);select=np.array(image)[:,:,3]>128;self.assertTrue(np.array_equal(actual[select],np.array(image)[select]),'retain the exact complete boot donor pixels')

 def test_bone_slices_do_not_carry_a_second_boot_past_the_ankle(self):
  import json,numpy as np,math
  for filename in['aniu-map-rig.json','aniu-carnival.json']:
   rig=json.loads((ROOT/'src/modern/data'/filename).read_text())['characters'][0]
   for facing in rig['facings'].values():
    for actor in facing['actors']:
     for leg in actor['legs']:
      for name in[leg['upper'],leg['lower']]:
       p=actor['parts'][name];image=Image.open(ROOT/'public/modern'/p['url']).convert('RGBA');alpha=np.array(image)[:,:,3]
       ys,xs=np.where(alpha>128);axis=np.array(p['axis']);unit=axis/np.linalg.norm(axis)
       along=(xs-p['pivot'][0]*rig['density'])*unit[0]+(ys-p['pivot'][1]*rig['density'])*unit[1]
       allowance=1 if name==leg['lower'] else 9
       self.assertLessEqual(float(along.max()),float(np.linalg.norm(axis)*rig['density']+allowance),'a rotated shin must stop at the ankle; distal pixels belong to its independent boot')

 def test_edge_completion_cannot_put_an_old_arm_back_into_the_torso(self):
  b=self.builder();im=Image.new('RGBA',(20,20));ImageDraw.Draw(im).rectangle((5,5,14,14),fill='gold')
  body=Image.new('L',im.size);ImageDraw.Draw(body).rectangle((5,5,9,14),fill=255)
  arm=Image.new('L',im.size);ImageDraw.Draw(arm).rectangle((12,5,14,14),fill=255)
  forbidden=Image.new('L',im.size);ImageDraw.Draw(forbidden).rectangle((10,5,14,14),fill=255)
  layers={'body':(body,(5,5),None),'arm':(arm,(12,5),None)}
  b.complete_edges(im,layers,{'body':forbidden})
  self.assertEqual(layers['body'][0].getpixel((10,10)),0)
  self.assertEqual(layers['arm'][0].getpixel((10,10)),255)

 def test_packed_aniu_has_no_omitted_edges_or_second_baked_face(self):
  import json,numpy as np
  r=ROOT/'public/hd-review/characters-25';a=json.loads((r/'role-02-authoring.json').read_text());packed=json.loads((r/'role-02-rig.json').read_text())
  self.assertTrue(all(c['assignedFraction']>.99999 for c in packed['coverage']),'packing must retain the entire source silhouette')
  rig=packed['characters'][0];b=self.builder()
  heads=b.split_views(Image.open(r/a['expressionMaster']),4,3)
  for facing,description in zip(['down-right','down-left','up-left','up-right'],a['facings']):
   actor=rig['facings'][facing]['actors'][0];source=description['actors'][0];neck=source['joints']['neck']
   column=['down-right','down-left','up-left','up-right'].index(facing)
   for row,expression in enumerate(['happy','sad','hurt']):
    if facing=='up-left'and expression!='hurt':continue
    part=actor['parts']['head-'+expression]
    self.assertIn('sourceScale',part,'a complete head must retain its single source registration')
    image=heads[row*4+column];image=image.crop((0,0,image.width,a['expressionNeckRows'][row][column]+3))
    image=image.resize((round(image.width*part['sourceScale']),round(image.height*part['sourceScale'])),Image.Resampling.LANCZOS);image=image.crop(image.getbbox())
    actual=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')
    self.assertEqual(image.size,actual.size)
    select=np.asarray(image)[:,:,3]>128
    self.assertTrue(np.array_equal(np.asarray(image)[select],np.asarray(actual)[select]),'do not bake a second canonical nose, horn or eye underneath the expression')

 def test_single_character_build_is_explicit_and_never_silently_enables_all_candidates(self):
  b=self.builder()
  self.assertTrue(callable(getattr(b,'build_role',None)))
  import json
  author=json.loads((ROOT/'public/hd-review/characters-25/role-02-authoring.json').read_text())
  self.assertEqual(author['id'],2)
  self.assertEqual(len(author['facings']),4)
  self.assertTrue(all(len(f['actors'])==1 for f in author['facings']))

 def builder(self):
  path=ROOT/'scripts/build-characters25.py'
  self.assertTrue(path.is_file(),'item25 layer builder must exist')
  s=importlib.util.spec_from_file_location('characters25_build',path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

 def test_strip_uses_actual_pose_gaps_instead_of_cutting_a_wide_crab(self):
  b=self.builder();im=Image.new('RGBA',(300,90));d=ImageDraw.Draw(im)
  for rect,color in [((4,10,76,80),'red'),((90,15,124,80),'green'),((143,10,221,80),'blue'),((240,15,284,80),'yellow')]:d.rectangle(rect,fill=color)
  poses=b.split_views(im,4,1)
  self.assertEqual([p.size for p in poses],[(73,71),(35,66),(79,71),(45,66)])
  self.assertEqual(poses[0].getchannel('A').getbbox(),(0,0,73,71))

 def test_paired_two_by_two_atlas_keeps_both_distinct_children(self):
  b=self.builder();im=Image.new('RGBA',(160,160));d=ImageDraw.Draw(im)
  for x,y in [(0,0),(80,0),(0,80),(80,80)]:
   d.rectangle((x+10,y+10,x+30,y+60),fill='red');d.rectangle((x+42,y+15,x+65,y+65),fill='blue')
  poses=b.split_views(im,2,2)
  for p in poses:
   colors=p.getcolors(p.width*p.height);self.assertTrue(any(c==(255,0,0,255)for _,c in colors));self.assertTrue(any(c==(0,0,255,255)for _,c in colors))

 def test_trimmed_layers_compensate_their_real_joint_pivot(self):
  b=self.builder();im=Image.new('RGBA',(80,90));ImageDraw.Draw(im).rectangle((22,33,51,65),fill='red')
  trimmed,info=b.register_part(im,(18,28),6,'example.png',axis=(12,18))
  self.assertEqual(trimmed.size,(30,33))
  # The old full-canvas landmark(40,50) must stay at exactly the same logical
  # location relative to its joint, even when that joint lies outside the crop.
  x=(40-22)/6-info['pivot'][0];y=(50-33)/6-info['pivot'][1]
  self.assertAlmostEqual(x,(40-18)/6);self.assertAlmostEqual(y,(50-28)/6)
  self.assertEqual(info['axis'],[2,3])

 def test_pair_foot_crossing_nominal_row_boundary_stays_with_its_child(self):
  b=self.builder();im=Image.new('RGBA',(200,200));d=ImageDraw.Draw(im)
  for x in [0,100]:
   d.rectangle((x+10,10,x+30,65),fill='red');d.rectangle((x+45,25,x+70,115),fill='blue')
   d.rectangle((x+10,140,x+30,180),fill='red');d.rectangle((x+45,140,x+70,180),fill='blue')
  poses=b.split_views(im,2,2)
  self.assertEqual(poses[0].height,106,'a nominal2x2 grid must not cut an entire child foot')
  self.assertEqual(poses[0].getpixel((60,105)),(0,0,255,255))

if __name__=='__main__':unittest.main()
