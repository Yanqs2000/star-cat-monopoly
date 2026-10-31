from pathlib import Path
import json,hashlib,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

class AniuMaterialsTest(unittest.TestCase):
 def test_complete_single_identity_material_routes_and_native_activity_clocks(self):
  data=json.loads((ROOT/'src/modern/data/characters-25.json').read_text())
  self.assertEqual(data['activeIds'],[2]);self.assertEqual(data['generationAllowedIds'],[2])
  self.assertTrue('assets'in data,'all A-Niu UI and possession assets must be registered')
  sources={a['source']for a in data['assets']}
  expected={f'assets/characters/2/reactions/gods/{i}.png'for i in[2,3,4,5,10,11]}|{'assets/activities/face-2/1.png','assets/activities/head-2/1.png','assets/monthly/champions/2.png'}
  self.assertEqual(sources,expected)
  self.assertIn('2',data['thumbnailUrls'])
  native=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
  ids={c['id']for c in data['activityClips']}
  self.assertEqual(ids,{'face-2','head-2',*[f'fly-2-{i}'for i in range(1,5)],'carnival-boy-2','carnival-walk-2-left','carnival-walk-2-right'})
  for clip in data['activityClips']:
   original=next(c for c in native['clips']if c['id']==clip['id'])
   self.assertAlmostEqual(len(clip['frames'])/clip['fps'],len(original['frames'])/original['fps'])
   if clip['id'].startswith('carnival-walk-'):
    self.assertEqual(clip['fps'],120);self.assertEqual(len(clip['frames']),64)
    self.assertEqual(len({f['url']for f in clip['frames']}),16)
  for image in data['runtimeImages']:
   path=ROOT/'public/modern'/image['url'];self.assertTrue(path.is_file())
   with Image.open(path)as decoded:self.assertEqual(list(decoded.size),image['pixelSize'])
   self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),image['sha256'])

if __name__=='__main__':unittest.main()
