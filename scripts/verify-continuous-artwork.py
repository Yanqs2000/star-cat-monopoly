"""Independently verify source registration, lossless reconstruction and scope of18/19/21."""
from pathlib import Path
from PIL import Image
import json,hashlib
import numpy as np
R=Path(__file__).resolve().parents[1];review=R/'public/hd-review/non-character-18-21';p=R/'public/modern';data=json.loads((R/'src/modern/data/continuous-non-character.json').read_text());source=json.loads((p/'assets/activities/manifest.json').read_text());config=json.loads((review/'motion-config.json').read_text());cache=R/'.analysis-cache/18-21/render';expected={'ludo-dice':80,'show2':45,'show-npc4':50,'car1':226,'car2':222}
assert data['scope']==[18,19,21] and data['deferred']==[20]
assert hashlib.sha256((R/'public/original/play.swf').read_bytes()).hexdigest()==data['sourceSha256']=='790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba'
assert {c['id']for c in data['activityClips']}==set(expected)
images={x['url']:x for x in data['runtimeImages']};used=set();results=[]
for image in images.values():
 path=p/image['url'];assert hashlib.sha256(path.read_bytes()).hexdigest()==image['sha256'];assert list(Image.open(path).size)==image['pixelSize']
for c in data['activityClips']:
 before=next(x for x in source['clips']if x['id']==c['id']);assert len(c['frames'])==expected[c['id']];assert len(c['frames'])/c['fps']==len(before['frames'])/30
 if c['id']=='ludo-dice':
  for i in range(40):assert c['frames'][i*2]['placements']==before['frames'][i].get('placements',[])
  for frame in c['frames'][:32]:assert not any(x['name']=='tz4'for x in frame['placements'])
  assert c['frames'][32]['placements'][-1]['name']=='tz4'
  results.append({'id':c['id'],'sourceSamplesExact':40,'displaySamples':80,'newTextures':0});continue
 cfg=config['clips'][c['id']];density=cfg['density'];max_step=0;last=None
 for i,frame in enumerate(c['frames']):
  used.add(frame['url']);im=Image.open(p/frame['url']).convert('RGBA');assert im.size==(frame['width']*density,frame['height']*density)
  assert frame['fields']==before['frames'][i//(2 if c['fps']==60 else 1)]['fields']
  canvas=Image.new('RGBA',(cfg['width']*density,cfg['height']*density));dx=round((frame['offsetX']-cfg['offsetX'])*density);dy=round((frame['offsetY']-cfg['offsetY'])*density);canvas.paste(im,(dx,dy))
  actual=np.asarray(canvas);raw=np.asarray(Image.open(cache/c['id']/f'{i+1}.png').convert('RGBA'));assert np.array_equal(actual[:,:,3],raw[:,:,3]);mask=raw[:,:,3]>0;assert np.array_equal(actual[:,:,:3][mask],raw[:,:,:3][mask])
  if last is not None:max_step=max(max_step,float(np.abs(actual.astype(float)-last).mean()))
  last=actual.astype(float)
 results.append({'id':c['id'],'reconstructedFrames':len(c['frames']),'alphaAndVisibleRgbExact':True,'maxMeanPixelStep':max_step})
assert used==set(images)
assert {x.relative_to(p).as_posix() for x in (p/'hd-static/continuous-18-21').rglob('*.webp')}==set(images)
report=json.loads((review/'verification.json').read_text());report.update(status='technical-artifact-checks-passed; pending-browser-and-user-art-acceptance',sourceSha256=data['sourceSha256'],reconstruction=results);(review/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'runtimeFiles':len(images),'clips':results,'sourceUnchanged':True,'deferred20Unchanged':True},ensure_ascii=False))
