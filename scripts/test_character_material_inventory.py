"""Native coverage before building the next two complete identities."""
from pathlib import Path
import hashlib,json,unittest
ROOT=Path(__file__).resolve().parents[1]

class InventoryTest(unittest.TestCase):
 def test_complete_native_inventories_match_every_character_png_and_activity(self):
  activities=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
  for cid in [11,6]:
   path=ROOT/f'public/hd-review/characters-25/role-{cid:02d}-material-sources.json'
   self.assertTrue(path.exists(),f'role{cid}: full native inventory required')
   data=json.loads(path.read_text());frames=data['frames'];urls=[f['url']for f in frames]
   self.assertEqual(len(urls),len(set(urls)))
   actual={str(p.relative_to(ROOT/'public/modern'))for p in (ROOT/f'public/modern/assets/characters/{cid}').rglob('*.png')}
   self.assertEqual({u for u in urls if u.startswith(f'assets/characters/{cid}/')},actual)
   expected_ids={f'face-{cid}',f'head-{cid}',*[f'fly-{cid}-{i}'for i in range(1,5)],f'carnival-boy-{cid}',f'carnival-walk-{cid}-left',f'carnival-walk-{cid}-right'}
   clips=[c for c in activities['clips']if c['id']in expected_ids]
   self.assertEqual(set(data['activityIds']),expected_ids)
   expected_activity={f['url']for c in clips for f in c['frames']}
   self.assertEqual({u for u in urls if u.startswith('assets/activities/')},expected_activity)
   self.assertIn(f'assets/monthly/champions/{cid}.png',urls)
   for entry in frames:
    source=ROOT/'public/modern'/entry['url']
    self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),entry['sha256'])
   self.assertEqual(data['counts']['total'],len(frames))

if __name__=='__main__':unittest.main()
