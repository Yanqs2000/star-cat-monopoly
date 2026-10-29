"""Pixel regressions against actual installed candidate artwork."""
from pathlib import Path
import unittest,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
class NoticeOpacity(unittest.TestCase):
 def test_notice_title_preserves_original_opaque_blue(self):
  index=json.loads((ROOT/'src/modern/data/continuous-non-character.json').read_text());images={x['url']:x for x in index['runtimeImages']}
  for id in ['show2','show-npc4']:
   with self.subTest(id=id):
    source=Image.open(ROOT/f'public/modern/assets/activities/{id}/1.png').convert('RGBA')
    self.assertEqual(source.getchannel('A').crop((110,39,330,67)).getextrema(),(255,255))
    frame=next(c for c in index['activityClips']if c['id']==id)['frames'][0];density=images[frame['url']]['pixelDensity'];installed=Image.open(ROOT/'public/modern'/frame['url']).convert('RGBA')
    alpha=installed.getchannel('A').crop(tuple(n*density for n in (110,39,330,67)))
    self.assertEqual(alpha.getextrema(),(255,255),'map must not show through the notice title area')
if __name__=='__main__':unittest.main()
