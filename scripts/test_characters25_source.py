"""Source contracts for the next approved production queue item."""
from pathlib import Path
import hashlib,json,unittest

ROOT=Path(__file__).resolve().parents[1]

class Characters25SourceTest(unittest.TestCase):
 def test_all_eleven_identities_keep_their_original_four_direction_timings(self):
  path=ROOT/'public/hd-review/characters-25/source-index.json'
  self.assertTrue(path.is_file(),'item25 source inventory must exist before production')
  data=json.loads(path.read_text());self.assertEqual([r['id']for r in data['roles']],list(range(2,13)))
  clocks=ROOT/'src/modern/data/characters-25-source.json'
  self.assertTrue(clocks.is_file(),'runtime timing index must derive from native manifests')
  runtime=json.loads(clocks.read_text())
  for role in data['roles']:
   original=ROOT/f"public/original/star{role['id']}.swf"
   self.assertEqual(role['sourceSwfSha256'],hashlib.sha256(original.read_bytes()).hexdigest())
   manifest=json.loads((ROOT/f"public/modern/assets/characters/{role['id']}/reactions/manifest.json").read_text())
   self.assertEqual(set(role['facings']),{'down-right','down-left','up-left','up-right'})
   for facing,definition in role['facings'].items():
    for action in ['neutral','ready','happy','sad','hurt','cheer']:
     source=next(c for c in manifest['clips']if c['name']==action and c['facing']==facing)
     self.assertAlmostEqual(definition['durationsMs'][action],len(source['frames'])*1000/source['fps'])
     self.assertAlmostEqual(runtime[str(role['id'])][facing][action],definition['durationsMs'][action])
   self.assertTrue((ROOT/role['referenceImage']).is_file())
  self.assertEqual(next(r for r in data['roles']if r['id']==3)['anatomy'],'paired')
  self.assertEqual(next(r for r in data['roles']if r['id']==4)['anatomy'],'crab')
  self.assertEqual(next(r for r in data['roles']if r['id']==8)['anatomy'],'scorpion')
  for cid in [6,7,12]:self.assertEqual(next(r for r in data['roles']if r['id']==cid)['anatomy'],'floating')
  self.assertEqual(next(r for r in data['roles']if r['id']==9)['anatomy'],'centaur')

if __name__=='__main__':unittest.main()
