"""NPC22 registration, timing and morph regressions, with independent toy geometry."""
import importlib.util
from pathlib import Path
import unittest
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('npc22_build', Path(__file__).with_name('build-npc22.py'))
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class Npc22ArtworkTest(unittest.TestCase):
 def test_atlas_uses_actual_grid_dimensions_and_rejects_missing_pose(self):
  atlas=Image.new('RGBA',(160,80));draw=ImageDraw.Draw(atlas)
  draw.rectangle((11,13,41,65),fill='red');draw.rectangle((100,9,150,60),fill='blue')
  poses=build.split_atlas(atlas,2)
  self.assertEqual([pose.size for pose in poses],[(31,53),(51,52)])
  with self.assertRaisesRegex(ValueError,'empty'):
   build.split_atlas(Image.new('RGBA',(160,80)),2)

 def test_rejects_near_empty_cells_with_only_small_opaque_artifacts(self):
  atlas=Image.new('RGBA',(160,80));draw=ImageDraw.Draw(atlas)
  draw.rectangle((10,10,20,20),fill='red');draw.rectangle((100,10,150,60),fill='blue')
  with self.assertRaisesRegex(ValueError,'empty'):
   build.split_atlas(atlas,2)

 def test_layout_can_skip_an_empty_grid_cell_without_merging_neighbours(self):
  atlas=Image.new('RGBA',(240,80));draw=ImageDraw.Draw(atlas)
  for x,color in [(10,'red'),(70,'green'),(190,'blue')]:draw.rectangle((x,10,x+39,69),fill=color)
  poses=build.split_atlas(atlas,3,{'columns':4,'rows':1,'cells':[0,1,3]})
  self.assertEqual([pose.size for pose in poses],[(40,60)]*3)
  self.assertEqual(poses[2].getpixel((20,30)),(0,0,255,255))

 def test_alpha_registration_discards_a_thin_grid_connected_to_the_body(self):
  atlas=Image.new('RGBA',(160,80));draw=ImageDraw.Draw(atlas)
  for x in [0,80]:
   draw.rectangle((x,5,x+79,8),fill='red');draw.rectangle((x+29,5,x+32,20),fill='red')
   draw.rectangle((x+15,20,x+45,70),fill='red')
  poses=build.split_atlas(atlas,2)
  self.assertEqual(poses[0].width,31)
  self.assertLessEqual(poses[0].height,55)

 def test_border_grid_strip_is_not_a_significant_detached_body_part(self):
  atlas=Image.new('RGBA',(160,80));draw=ImageDraw.Draw(atlas)
  for x in [0,80]:
   draw.rectangle((x+15,20,x+45,70),fill='red')
   draw.rectangle((x,77,x+79,79),fill='yellow')
  poses=build.split_atlas(atlas,2)
  self.assertEqual(poses[0].size,(31,51))

 def test_body_registers_to_its_source_rectangle_without_shadow_inflation(self):
  body=Image.new('RGBA',(20,60),'red')
  registered=build.register_pose(body,(-5,-70,25,0),(-10,-80,30,20),2)
  self.assertEqual(registered.size,(80,200))
  self.assertEqual(registered.getchannel('A').getbbox(),(10,20,70,160))

 def test_long_hold_remains_still_until_three_ticks_before_next_pose(self):
  schedule=[0]*43+[1]*3
  self.assertEqual(build.pose_sample(schedule,39),(0,0,0))
  self.assertEqual(build.pose_sample(schedule,40),(0,1,0))
  self.assertEqual(build.pose_sample(schedule,41.5),(0,1,.5))
  self.assertEqual(build.pose_sample(schedule,43),(1,0,0))
  self.assertEqual(build.pose_sample(schedule,46),(0,0,0))

 def test_motion_warp_moves_one_silhouette_instead_of_crossfading_two(self):
  a=Image.new('RGBA',(80,64));b=a.copy()
  ImageDraw.Draw(a).rectangle((12,22,30,40),fill=(240,90,30,255))
  ImageDraw.Draw(b).rectangle((36,22,54,40),fill=(240,90,30,255))
  half=build.morph_pair(a,b,.5)
  box=half.getchannel('A').point(lambda x:255 if x>=100 else 0).getbbox()
  self.assertLess(abs((box[0]+box[2])/2-33.5),2)
  self.assertLess(box[2]-box[0],24)
  self.assertEqual(build.morph_pair(a,b,0).tobytes(),a.tobytes())
  self.assertEqual(build.morph_pair(a,b,1).tobytes(),b.tobytes())

 def test_visible_surface_changes_continuously_without_a_midpoint_texture_cut(self):
  a=Image.new('RGBA',(80,64));b=a.copy()
  ImageDraw.Draw(a).rectangle((20,16,60,50),fill=(255,0,0,255))
  ImageDraw.Draw(b).rectangle((20,16,60,50),fill=(0,0,255,255))
  samples=[build.morph_pair(a,b,i/20).getpixel((40,32))for i in range(21)]
  self.assertTrue(all(p[3]==255 for p in samples))
  self.assertLessEqual(max(max(abs(x-y)for x,y in zip(p,q))for p,q in zip(samples,samples[1:])),14)


if __name__=='__main__':unittest.main()
