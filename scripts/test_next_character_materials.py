from pathlib import Path
import json,hashlib,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class NextCharacterMaterials(unittest.TestCase):
 def test_weiwei_end_of_carnival_cycle_does_not_reset_to_first_pose(self):
  d=json.loads((ROOT/'src/modern/data/weiwei-complete.json').read_text());images={i['url']:i['sha256']for i in d['runtimeImages']}
  for side in ['left','right']:
   clip=next(c for c in d['activityClips']if c['id']==f'carnival-walk-6-{side}')
   first=images[clip['frames'][0]['url']]
   for index in range(41,48):self.assertNotEqual(images[clip['frames'][index]['url']],first,'offline export must advance past80px without triggering the live teleport guard')

 def test_weiwei_champion_keeps_native_closed_floating_gown_without_carnival_feet(self):
  import numpy as np
  p=ROOT/'public/modern/hd-characters/characters-25/role-06/champion.webp';im=Image.open(p).convert('RGBA');box=im.getbbox()
  pixels=np.array(im).astype(int);start=round(box[1]+(box[3]-box[1])*.88);bottom=pixels[start:box[3]]
  skin=(bottom[:,:,0]-bottom[:,:,1]>10)&(bottom[:,:,1]-bottom[:,:,2]>4)&(bottom[:,:,0]>140)&(bottom[:,:,3]>128)
  self.assertEqual(int(skin.sum()),0,'the native monthly Weiwei has a closed floating gown; dangling carnival feet belong only to the activity')

 def verify_character(self,cid,stem):
  path=ROOT/f'src/modern/data/{stem}-complete.json';self.assertTrue(path.exists(),f'role{cid} complete material pack required')
  d=json.loads(path.read_text());self.assertEqual(d['activeIds'],[cid])
  expected={f'assets/characters/{cid}/reactions/gods/{g}.png'for g in [2,3,4,5,10,11]}|{f'assets/activities/face-{cid}/1.png',f'assets/activities/head-{cid}/1.png',f'assets/monthly/champions/{cid}.png'}
  self.assertEqual({a['source']for a in d['assets']},expected)
  native=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
  ids={f'face-{cid}',f'head-{cid}',*[f'fly-{cid}-{g}'for g in range(1,5)],f'carnival-boy-{cid}',f'carnival-walk-{cid}-left',f'carnival-walk-{cid}-right'}
  self.assertEqual({c['id']for c in d['activityClips']},ids)
  for clip in d['activityClips']:
   source=next(c for c in native['clips']if c['id']==clip['id'])
   self.assertAlmostEqual(len(clip['frames'])/clip.get('fps',30),len(source['frames'])/source.get('fps',30))
   if clip['id'].startswith('carnival-walk'):
    self.assertEqual(clip['fps'],120);self.assertEqual(len(clip['frames']),len(source['frames'])*4)
    if cid in [3,4,5,7,8,9,6,10,12]:self.assertEqual(len({f['url']for f in clip['frames']}),len(source['frames'])*4,'one full native movement cycle must not repeat a truncated cycle')
  self.assertIn(str(cid),d['thumbnailUrls'])
  for entry in d['runtimeImages']:
   p=ROOT/'public/modern'/entry['url'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),entry['sha256'])
   with Image.open(p)as im:self.assertEqual(list(im.size),entry['pixelSize'])
  # Physical raster bounds, including ALL intermediate walking frames.
  samples={9:64,8:64,5:64,3:64,4:72,7:64,6:48,10:56,12:64,11:16}[cid]
  for name in ['thumbnail','champion',*[f'carnival-{side}-{i}'for side in ['left','right']for i in range(samples)]]:
   p=ROOT/f'public/modern/hd-characters/characters-25/role-{cid:02d}/{name}.webp'
   # The packed thumbnail is intentionally trimmed; its source raster must
   # contain the whole character before that lossless bounding-box crop.
   if name=='thumbnail':
    batch='dapai-dawei-afei'if cid in[5,8,9]else'jjmm-jiajia-shuaige'if cid in[3,4,7]else'ajie-nini'if cid in[10,12]else'guaika-weiwei'
    p=Path(f'/tmp/starcat-{batch}/role-{cid}/material-renders/thumbnail.png')
   with Image.open(p)as im:
    box=im.getbbox();self.assertIsNotNone(box);self.assertGreater(box[0],0);self.assertGreater(box[1],0);self.assertLess(box[2],im.width);self.assertLess(box[3],im.height)

 def test_guaika_complete_native_routes_and_unclipped_artwork(self):self.verify_character(11,'guaika')
 def test_weiwei_complete_native_routes_and_unclipped_artwork(self):self.verify_character(6,'weiwei')
 def test_ajie_complete_native_routes_and_unclipped_artwork(self):self.verify_character(10,'ajie')
 def test_nini_complete_native_routes_and_unclipped_artwork(self):self.verify_character(12,'nini')
 def test_jjmm_complete_native_routes_and_unclipped_artwork(self):self.verify_character(3,'jjmm')
 def test_jiajia_complete_native_routes_and_unclipped_artwork(self):self.verify_character(4,'jiajia')
 def test_shuaige_complete_native_routes_and_unclipped_artwork(self):self.verify_character(7,'shuaige')
 def test_dapai_complete_native_routes_and_unclipped_artwork(self):self.verify_character(5,'dapai')
 def test_dawei_complete_native_routes_and_unclipped_artwork(self):self.verify_character(8,'dawei')
 def test_afei_complete_native_routes_and_unclipped_artwork(self):self.verify_character(9,'afei')

if __name__=='__main__':unittest.main()
