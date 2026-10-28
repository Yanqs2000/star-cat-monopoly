"""Independently verify trimmed-frame registration and every source-rendered visible pixel."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,sys
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'public/hd-review/non-character-13-17';P=ROOT/'public/modern';CACHE=ROOT/'.analysis-cache/effects-render';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def visible_hash(im):
 a=np.asarray(im.convert('RGBA'));return hashlib.sha256(a[:,:,3].tobytes()+a[:,:,:3][a[:,:,3]>0].tobytes()).hexdigest()
m=json.loads((ROOT/'src/modern/data/non-character-effects.json').read_text());q=json.loads((R/'verification.json').read_text());config=json.loads((R/'motion-config.json').read_text());assert sha(ROOT/'public/original/play.swf')==m['sourceSha256']==config['sourceSha256']
for item in m['runtimeImages']:
 p=P/item['url'];assert p.resolve().is_relative_to((P/'hd-static/effects-13-17').resolve());assert sha(p)==item['sha256'];im=Image.open(p);assert list(im.size)==item['pixelSize']
clips={c['id']:c for c in m['worldClips']+m['activityClips']};total=0
for id,c in clips.items():
 cfg=config['clips'][id];record=next(x for x in q['clips']if x['id']==id);assert c['fps']==60 and len(c['frames'])==cfg['count'];assert abs(len(c['frames'])/60-cfg['sourceFrames']/30)<1e-9;hashes=[];areas=[]
 for i,f in enumerate(c['frames']):
  full=Image.new('RGBA',(cfg['width']*4,cfg['height']*4));part=Image.open(P/f['url']).convert('RGBA');assert part.size==(f['width']*4,f['height']*4);x=(f['offsetX']-cfg['offsetX'])*4;y=(f['offsetY']-cfg['offsetY'])*4;assert abs(x-round(x))<1e-5 and abs(y-round(y))<1e-5;full.paste(part,(round(x),round(y)));digest=visible_hash(full);hashes.append(digest);areas.append(int(np.count_nonzero(np.asarray(full.getchannel('A')))))
  if '--capture-baseline' in sys.argv:assert digest==visible_hash(Image.open(CACHE/id/f'{i+1:04}.png'))
  else:assert digest==record['frameVisibleSha256'][i],(id,i,'registration or pixels changed')
  total+=1
 assert areas[-1]==0 and any(areas)
 maxrun=run=0;previous=None
 for h,area in zip(hashes,areas):
  if not area:run=0;previous=None;continue
  run=run+1 if h==previous else 1;previous=h;maxrun=max(maxrun,run)
 assert maxrun<=2,(id,maxrun)
 if id=='rocket':assert all(a==0 for a in areas[78:138])
 record['frameVisibleSha256']=hashes;record['longestRepeatedVisibleRun']=maxrun
 assert next(x for x in q['browserRender']['clips']if x['id']==id)['maxOutsideAlpha']<=8
print(json.dumps({'framesReconstructed':total,'sourceUnchanged':True,'alphaAndVisibleRgbExact':True,'noVisibleClippingAboveAlpha':8,'allFiveEndTransparent':True,'runtimeBytes':q['runtimeBytes'],'decodedRgbaBytes':q['decodedRgbaBytes']}))
if '--capture-baseline' in sys.argv:(R/'verification.json').write_text(json.dumps(q,indent=2)+'\n')
