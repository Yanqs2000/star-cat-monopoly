from pathlib import Path
import importlib.util,json,shutil,tempfile,unittest
from unittest.mock import patch
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'

class JiajiaArtwork(unittest.TestCase):
 def test_four_views_keep_two_main_feet_six_sidelegs_two_claws_and_two_eyes(self):
  data=json.loads((ROOT/'src/modern/data/jiajia-map-rig.json').read_text())
  for view in data['characters'][0]['facings'].values():
   actor=view['actors'][0];self.assertEqual(len(actor['legs']),2);self.assertEqual(len(actor['arms']),0)
   for prefix,count in [('sideLeg',6),('claw',2),('eye',2)]:self.assertEqual(len([e for e in actor['appendages']if e['part'].startswith(prefix)]),count)
   for eye in ['eye0','eye1']:
    for state in ['happy','sad','hurt']:self.assertIn(eye+'-'+state,actor['parts'])
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))

 def test_real_carnival_rasters_have_continuous_native_72_sample_loops(self):
  for side in ['left','right']:
   frames=[]
   for index in range(72):
    image=Image.open(ROOT/f'public/modern/hd-characters/characters-25/role-04/carnival-{side}-{index}.webp').convert('RGBA');a=np.array(image).astype('float32');a[:,:,:3]*=a[:,:,3:]/255;frames.append(a)
   steps=[float(np.abs(a-b).mean())for a,b in zip(frames,frames[1:])];self.assertGreater(max(steps),.001)
   self.assertLessEqual(float(np.abs(frames[-1]-frames[0]).mean()),max(steps)*1.05)

 def test_main_foot_surfaces_are_complete_without_an_internal_rectangular_cutout(self):
  # A whole oval sole has one horizontal opaque run per scanline. Source
  # silhouette masks used to remove a rectangular piece from the near foot.
  for stem in ['jiajia-map-rig','jiajia-carnival']:
   rig=json.loads((ROOT/f'src/modern/data/{stem}.json').read_text())['characters'][0]
   for facing,view in rig['facings'].items():
    actor=view['actors'][0]
    for leg in actor['legs']:
     part=actor['parts'][leg['tip']];alpha=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA'))[:,:,3]
     for row in alpha:
      xs=np.where(row>128)[0]
      if len(xs)>6:self.assertLessEqual(int(np.count_nonzero(row[xs[0]:xs[-1]+1]<64)),2,stem+'/'+facing+'/'+leg['name']+': complete foot cannot contain the old mask cutout')

 def test_eyestalk_roots_overlap_the_complete_carapace_in_all_states(self):
  data=json.loads((ROOT/'src/modern/data/jiajia-map-rig.json').read_text());rig=data['characters'][0]
  for facing,view in rig['facings'].items():
   actor=view['actors'][0];neck=actor['joints']['neck']
   for expression in ['','-happy','-sad','-hurt']:
    part=actor['parts']['head'+expression];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')
    for eye in ['eye0','eye1']:
     root=actor['joints'][eye];x,y=[round((v-o+p)*rig['density'])for v,o,p in zip(root,neck,part['pivot'])]
     alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
     self.assertGreater(alpha,128,facing+expression+'/'+eye+': eyestalk cannot float above shell')

 def test_independent_eyestalk_expression_surfaces_are_packed_with_their_own_pivots(self):
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  author=json.loads((REVIEW/'role-12-authoring.json').read_text())
  for view in author['facings']:
   extra=view['actors'][0]['extras'][0];extra['phase']=.5
   extra['expressionSources']={'happy':{'sourceMaster':'eye.png','sourcePolygon':[[0,0],[19,0],[19,29],[0,29]],'sourcePivot':[10,28],'sourceScale':2}}
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);local=target/'review';local.mkdir();(local/'masters').symlink_to(REVIEW/'masters',target_is_directory=True);shutil.copy2(REVIEW/'source-index.json',local/'source-index.json');(target/'src/modern/data').mkdir(parents=True);Image.new('RGBA',(20,30),'lime').save(local/'eye.png')
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',local):data=packing.build_role(author)
   for view in data['characters'][0]['facings'].values():
    actor=view['actors'][0];extra=actor['appendages'][0];self.assertEqual(extra.get('phase'),.5)
    name=extra['part']+'-happy';self.assertIn(name,actor['parts']);part=actor['parts'][name]
    self.assertEqual(part['pivot'],[20/author['density'],56/author['density']]);self.assertEqual(part['reconstructedFrom'],'eye.png')
    rgba=np.array(Image.open(target/'public/modern'/part['url']).convert('RGBA'));self.assertTrue(np.all(rgba[:,:,1]==255))

if __name__=='__main__':unittest.main()
