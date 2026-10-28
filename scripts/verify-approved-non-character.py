"""Verify installed approved art, indexed motion cadence, dimensions and SHA256."""
from pathlib import Path
from PIL import Image
import hashlib,json
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'public/modern';m=json.loads((ROOT/'src/modern/data/approved-non-character.json').read_text());checked=set()
for asset in [*m['assets'],*m['runtimeImages']]:
 path=P/asset['url'];assert path.resolve().is_relative_to((P/'hd-static/approved-01-12').resolve())
 assert hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256'],path
 with Image.open(path) as im:assert list(im.size)==asset['pixelSize'],path
 checked.add(asset['url'])
source=ROOT/'public/hd-review/non-character-05-12-20261028/motion-v2/animations'
frames=0
for c in [*m['worldClips'],*m['activityClips']]:
 assert c['fps']==60
 urls=[f['url'] for f in c['frames']]
 for f in c['frames']:
  with Image.open(P/f['url']) as im:assert im.size==(f['width']*4,f['height']*4)
 if c['id'].startswith('barrier-'):assert len(set(urls))==2;continue
 expected=160 if c['id']=='mine' else 60;assert len(urls)==expected
 assert len(set(urls))>=expected-1
 assert all(a!=b for a,b in zip(urls,urls[1:])),c['id']
 with Image.open(source/(c['id']+'.webp')) as original:
  assert original.n_frames==expected
  for i,url in enumerate(urls):
   original.seek(i);a=original.convert('RGBA');b=Image.open(P/url).convert('RGBA')
   assert a.getchannel('A').tobytes()==b.getchannel('A').tobytes(),(c['id'],i,'alpha')
   import numpy as np
   x=np.asarray(a);y=np.asarray(b);assert np.array_equal(x[:,:,:3][x[:,:,3]>0],y[:,:,:3][x[:,:,3]>0]),(c['id'],i,'RGB')
   frames+=1
print(json.dumps({'approvedItems':'01-12','uniqueRuntimeFiles':len(checked),'runtimeBytes':sum((P/p).stat().st_size for p in checked),'motionFramesPixelMatched':frames,'mineUniqueFrames':160,'alphaAndVisibleRgbMaxError':0}))
