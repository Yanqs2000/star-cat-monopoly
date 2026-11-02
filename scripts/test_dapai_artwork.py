from pathlib import Path
from PIL import Image
import json,unittest,numpy as np,copy,importlib.util,tempfile,shutil
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
class DapaiArtwork(unittest.TestCase):
 def test_four_direction_map_keeps_complete_paws_arms_tail_and_all_expressions(self):
  path=ROOT/'src/modern/data/dapai-map-rig.json';self.assertTrue(path.exists(),'Dapai requires a complete independently packed map rig')
  data=json.loads(path.read_text());rig=data['characters'][0];self.assertEqual(rig['id'],5);self.assertEqual(rig['anatomy'],'biped')
  for facing,view in rig['facings'].items():
   actor=view['actors'][0];self.assertEqual(len(actor['legs']),2);self.assertEqual(len(actor['arms']),2);self.assertIn('tail',[e['part']for e in actor['appendages']])
   for name in['head','head-happy','head-sad','head-hurt']:self.assertIn(name,actor['parts'])
   body=actor['parts']['body'];image=Image.open(ROOT/'public/modern'/body['url']).convert('RGBA');spine=actor['joints']['spine']
   for key in['neck',*[arm['root']for arm in actor['arms']]]:
    point=actor['joints'][key];x,y=[round((v-o+p)*rig['density'])for v,o,p in zip(point,spine,body['pivot'])];alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
    self.assertGreater(alpha,128,facing+'/'+key+': attachment must overlap the complete torso surface')
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))

 def test_main_paws_have_no_rectangular_holes_in_their_rounded_surfaces(self):
  path=ROOT/'src/modern/data/dapai-map-rig.json';self.assertTrue(path.exists(),'complete paw surfaces required');rig=json.loads(path.read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   for leg in view['actors'][0]['legs']:
    part=view['actors'][0]['parts'][leg['tip']];a=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA'))[:,:,3]
    for row in a[round(a.shape[0]*.2):round(a.shape[0]*.75)]:
     xs=np.where(row>128)[0]
     if len(xs)>8:self.assertLessEqual(int(np.count_nonzero(row[xs[0]:xs[-1]+1]<64)),2,facing+'/'+leg['name'])

 def test_small_skin_bones_do_not_expose_opaque_rectangular_corners(self):
  rig=json.loads((ROOT/'src/modern/data/dapai-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   actor=view['actors'][0]
   for limb in actor['legs']+actor['arms']:
    for name in [limb['upper'],limb['lower']]:
     part=actor['parts'][name];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')
     for x,y in[(0,0),(image.width-1,0),(0,image.height-1),(image.width-1,image.height-1)]:self.assertLess(image.getpixel((x,y))[3],128,facing+'/'+name+': native rounded joints cannot reveal a square skin patch')

 def test_red_ball_tail_has_no_baked_peach_body_patch(self):
  rig=json.loads((ROOT/'src/modern/data/dapai-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   part=view['actors'][0]['parts']['tail'];a=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')).astype(int);skin=(a[:,:,0]>150)&(a[:,:,1]>90)&(a[:,:,2]>60)&(a[:,:,0]-a[:,:,1]<110)&(a[:,:,1]-a[:,:,2]<80)&(a[:,:,3]>128)
   self.assertLessEqual(int(skin.sum()),3,facing+': the red tail must not rotate a copied peach hip outside the body')

 def test_torso_and_tail_do_not_expose_rectangular_crop_corners(self):
  rig=json.loads((ROOT/'src/modern/data/dapai-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   for name in['body','tail']:
    part=view['actors'][0]['parts'][name];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')
    for x,y in[(0,0),(image.width-1,0),(0,image.height-1),(image.width-1,image.height-1)]:self.assertLess(image.getpixel((x,y))[3],128,facing+'/'+name+': a round body or tail cannot have an opaque crop corner')

 def test_catching_paws_can_be_layered_in_front_of_the_large_mane(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing);author=json.loads((ROOT/'public/hd-review/characters-25/role-05-authoring.json').read_text())
  for view in author['facings']:
   for arm in view['actors'][0]['arms']:arm['overHead']=True
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);review=target/'review';review.mkdir();(review/'masters').symlink_to(ROOT/'public/hd-review/characters-25/masters',target_is_directory=True);shutil.copy2(ROOT/'public/hd-review/characters-25/source-index.json',review/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',review):data=packing.build_role(author)
   for view in data['characters'][0]['facings'].values():
    actor=view['actors'][0];order=actor['order']
    for arm in actor['arms']:
     for part in[arm['upper'],arm['lower'],arm['tip']]:self.assertGreater(order.index(part),order.index('head-expression'),'native raised catching paws must remain visible in front of the mane')
    self.assertEqual(len(order),len(set(order)))

 def test_actual_carnival_rasters_close_the_whole_native_64_sample_cycle(self):
  for side in['left','right']:
   first=ROOT/f'public/modern/hd-characters/characters-25/role-05/carnival-{side}-0.webp';self.assertTrue(first.exists(),'complete native carnival artwork must be exported')
   frames=[]
   for index in range(64):
    a=np.array(Image.open(ROOT/f'public/modern/hd-characters/characters-25/role-05/carnival-{side}-{index}.webp').convert('RGBA')).astype('float32');a[:,:,:3]*=a[:,:,3:]/255;frames.append(a)
   steps=[float(np.abs(a-b).mean())for a,b in zip(frames,frames[1:])];self.assertGreater(max(steps),.001);self.assertLessEqual(float(np.abs(frames[-1]-frames[0]).mean()),max(steps)*1.05)
if __name__=='__main__':unittest.main()
