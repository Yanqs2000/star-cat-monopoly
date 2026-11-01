from pathlib import Path
import hashlib,json,unittest,importlib.util,tempfile,shutil
from unittest.mock import patch
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class NiniArtwork(unittest.TestCase):
 def test_exported_carnival_images_close_the_full_native_cycle(self):
  import numpy as np
  for role,samples in [(10,56),(12,64)]:
   for side in ['left','right']:
    frames=[]
    for frame in range(samples):
     path=ROOT/f'public/modern/hd-characters/characters-25/role-{role}/carnival-{side}-{frame}.webp'
     pixels=np.array(Image.open(path).convert('RGBA')).astype('float32');pixels[:,:,:3]*=pixels[:,:,3:]/255;frames.append(pixels)
    steps=[float(np.abs(a-b).mean())for a,b in zip(frames,frames[1:])]
    self.assertGreater(max(steps),.001,'the exported frames must actually move')
    self.assertLessEqual(float(np.abs(frames[-1]-frames[0]).mean()),max(steps)*1.05,'wrapping the native clip must not introduce a larger raster jump')

 def test_exported_champion_uses_the_frontal_monthly_expression(self):
  import cv2,numpy as np
  data=json.loads((ROOT/'src/modern/data/nini-carnival.json').read_text());part=data['characters'][0]['facings']['down-right']['actors'][0]['parts']['head-champion']
  template=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA');template=template.resize((round(template.width*4/7),round(template.height*4/7)),Image.Resampling.LANCZOS)
  image=np.array(Image.open('/tmp/starcat-ajie-nini/role-12/material-renders/champion.png').convert('RGBA'));target=np.array(template);mask=(target[:,:,3]>230).astype('uint8')*255
  error=cv2.minMaxLoc(cv2.matchTemplate(image[:,:,:3],target[:,:,:3],cv2.TM_SQDIFF_NORMED,mask=mask))[0]
  self.assertLess(error,.03,'monthly must render the frontal closed-eye tiny-O donor, not the tilted smiling map reaction head')

 def test_fin_shoulders_rotate_over_closed_blue_body_surface(self):
  data=json.loads((ROOT/'src/modern/data/nini-map-rig.json').read_text());rig=data['characters'][0]
  for name,view in rig['facings'].items():
   actor=view['actors'][0];part=actor['parts']['body'];origin=actor['joints']['spine'];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')
   for fin in actor['appendages']:
    if fin['kind']!='flipper':continue
    root=actor['joints'][fin['joint']];x=round((root[0]-origin[0]+part['pivot'][0])*rig['density']);y=round((root[1]-origin[1]+part['pivot'][1])*rig['density'])
    alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
    self.assertGreater(alpha,128,name+': rotating fin must not reveal a shoulder hole')

 def test_monthly_has_its_own_frontal_closed_head_instead_of_three_quarter_map_head(self):
  review=ROOT/'public/hd-review/characters-25';author=json.loads((review/'role-12-carnival-authoring.json').read_text());author['facings'][0]['championHeadAtlasIndex']=1
  spec=importlib.util.spec_from_file_location('packing',ROOT/'scripts/build-characters25.py');packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
  with tempfile.TemporaryDirectory()as temporary:
   target=Path(temporary);local=target/'review';local.mkdir();(local/'masters').symlink_to(review/'masters',target_is_directory=True);shutil.copy2(review/'source-index.json',local/'source-index.json');(target/'src/modern/data').mkdir(parents=True)
   with patch.object(packing,'ROOT',target),patch.object(packing,'REVIEW',local):data=packing.build_role(author)
   actor=data['characters'][0]['facings']['down-right']['actors'][0]
   self.assertIn('head-champion',actor['parts'],'monthly expression must be registered from its frontal donor')
   normal=actor['parts']['head'];closed=actor['parts']['head-champion']
   self.assertNotEqual((target/'public/modern'/normal['url']).read_bytes(),(target/'public/modern'/closed['url']).read_bytes())
   self.assertEqual(closed['reconstructedFrom'],'masters/role-12-activity-heads-r1.png')

 def test_map_has_independent_fins_and_no_legs_with_complete_source_coverage(self):
  path=ROOT/'src/modern/data/nini-map-rig.json'
  self.assertTrue(path.exists(),'Nini needs her own complete four-direction rig')
  data=json.loads(path.read_text());rig=data['characters'][0]
  self.assertEqual(data['activeIds'],[12]);self.assertEqual(rig['anatomy'],'floating')
  self.assertEqual(set(rig['facings']),{'down-right','down-left','up-left','up-right'})
  for view in rig['facings'].values():
   actor=view['actors'][0];self.assertEqual(actor['legs'],[]);self.assertEqual(actor['arms'],[])
   self.assertTrue(any(e['kind']=='tail'for e in actor['appendages']))
   self.assertTrue(any(e['part']=='dorsal'for e in actor['appendages']))
   self.assertTrue(any(e['kind']=='flipper'for e in actor['appendages']))
   self.assertFalse(any(n.endswith(('Foot','Thigh','Shin'))for n in actor['parts']))
  self.assertTrue(all(c['missingPixels']==0 for c in data['coverage']))
  for item in data['runtimeImages']:
   image=ROOT/'public/modern'/item['url'];self.assertEqual(hashlib.sha256(image.read_bytes()).hexdigest(),item['sha256'])

if __name__=='__main__':unittest.main()
