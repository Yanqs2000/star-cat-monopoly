"""Real-art regressions; --legacy replays the rejected whole-silhouette motion."""
import importlib.util
import json
import math
from pathlib import Path
import sys
import unittest
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
LEGACY='--legacy' in sys.argv
if LEGACY:sys.argv.remove('--legacy')

def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

class FoxMotionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  b=load('npc_builder',ROOT/'scripts/build-npc22.py')
  review=ROOT/'public/hd-review/characters-22-23'
  definition=next(x for x in json.loads((review/'npc-pose-index.json').read_text())if x['id']=='npc-12')
  poses=b.split_atlas(Image.open(review/'npc-12-master.png'),6,json.loads((review/'npc-atlas-layout.json').read_text())['npc-12'])
  rects,_=b.source_body_rects(json.loads((review/'source-timeline.json').read_text()),263,81)
  union=b.union_rect(rects);canvas=tuple([math.floor(x)for x in union[:2]]+[math.ceil(x)for x in union[2:]])
  cls.poses=[b.register_pose(p,rects[f-1],canvas,2)for p,f in zip(poses,definition['poseFirstFramesOneBased'])]
  if LEGACY:
   def sample(t):
    a,c,f=b.pose_sample(definition['framePoseIndicesZeroBased'],t)
    return cls.poses[a]if a==c else b.morph_pair(cls.poses[a],cls.poses[c],f)
  else:sample=load('fox_rig',ROOT/'scripts/npc22_fox_rig.py').prepare_rig('npc-12',cls.poses,2,canvas,ROOT,definition)
  cls.sample=staticmethod(sample)

 def test_gestures_leave_head_neck_and_boot_pixels_fixed(self):
  # Whole-body normalization or face flow changes these independently inspected regions.
  for base,times in [(0,[10,11,11.5,13,14,16,22,24,26]),(40,[50,51,51.5,53,54,56,62,64,66])]:
   expected=np.asarray(self.sample(base))
   for t in times:
    actual=np.asarray(self.sample(t))
    np.testing.assert_array_equal(actual[:110],expected[:110],err_msg=f'head moved at {t}')
    np.testing.assert_array_equal(actual[146:],expected[146:],err_msg=f'boots moved at {t}')

 def test_fractional_gesture_samples_actually_move_arms(self):
  frames=[np.asarray(self.sample(t))for t in [10,10.5,11,11.5,12,12.5,13]]
  self.assertGreater(len({f.tobytes()for f in frames}),4,'Gesture falls back to held native keyframes')
  changed=np.any(frames[0]!=frames[-1],axis=2)
  self.assertGreater(int(changed.sum()),30)
  self.assertFalse(changed[:110].any(),'Expression must not drift to fake arm motion')

 def test_padded_builder_canvas_moves_the_rig_with_the_mother(self):
  if LEGACY:self.skipTest('legacy has no articulated rig')
  padded=[]
  for pose in self.poses:
   image=Image.new('RGBA',(178,238));image.alpha_composite(pose,(32,32));padded.append(image)
  rig=load('padded_fox_rig',ROOT/'scripts/npc22_fox_rig.py')
  review=ROOT/'public/hd-review/characters-22-23'
  definition=next(x for x in json.loads((review/'npc-pose-index.json').read_text())if x['id']=='npc-12')
  sample=rig.prepare_rig('npc-12',padded,2,(-15,-81,74,38),ROOT,definition)
  for t in [0,11.5,14,37,40,53,78]:
   actual=np.asarray(sample(t))[32:206,32:146]
   np.testing.assert_array_equal(actual,np.asarray(self.sample(t)),err_msg=f'Padding changed character at {t}')

 def test_planted_boots_remain_fixed_through_the_turn(self):
  expected=np.asarray(self.sample(0))[146:]
  for t in [frame/2 for frame in range(162)]:
   np.testing.assert_array_equal(np.asarray(self.sample(t))[146:],expected,err_msg=f'Turn invented a walking foot at {t}')

 def test_turn_surfaces_do_not_pop_at_texture_switches(self):
  changes=[]
  for tick in range(120):
   t=34+tick/20
   a=np.asarray(self.sample(t),np.float32)/255;b=np.asarray(self.sample(t+.05),np.float32)/255
   a[:,:,:3]*=a[:,:,3:4];b[:,:,:3]*=b[:,:,3:4]
   changes.append(float(np.abs(a-b).sum()))
  self.assertLess(max(changes),1500,'Abrupt whole-surface texture switch during turn')

 def test_cold_blue_collar_belongs_to_body_and_white_chin_to_head(self):
  if LEGACY:self.skipTest('Legacy has no layer classifier')
  rig=load('layer_fox_rig',ROOT/'scripts/npc22_fox_rig.py')
  image=Image.new('RGBA',(114,174));image.putpixel((60,114),(80,150,200,255));image.putpixel((50,112),(210,207,200,255))
  head,body=rig._head_and_body(image,1)
  self.assertEqual(head.getpixel((60,114))[3],0)
  self.assertEqual(body.getpixel((60,114)),(80,150,200,255))
  self.assertEqual(head.getpixel((50,112)),(210,207,200,255))

 def test_actual_two_facings_and_loop_are_preserved(self):
  np.testing.assert_array_equal(np.asarray(self.sample(0))[:110],np.asarray(self.poses[0])[:110])
  side=Image.new('RGBA',self.poses[3].size);side.alpha_composite(self.poses[3],(9,4))
  np.testing.assert_array_equal(np.asarray(self.sample(40))[:100],np.asarray(side)[:100])
  np.testing.assert_array_equal(np.asarray(self.sample(81)),np.asarray(self.sample(0)))
  for t in [0,11.5,35,38.5,40,55,77.5,80.5]:
   im=self.sample(t);self.assertEqual(im.mode,'RGBA');self.assertEqual(im.size,(114,174))

if __name__=='__main__':unittest.main()
