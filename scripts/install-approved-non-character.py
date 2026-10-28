"""Package user-approved 01–12 art; preserve originals and source masters."""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];PUBLIC=ROOT/'public/modern';REVIEW=ROOT/'public/hd-review/non-character-05-12-20261028';ICONS=ROOT/'public/hd-review/ui-icons-20261028';PREFIX='hd-static/approved-01-12';OUT=PUBLIC/PREFIX
assets=[];runtime=[];world=[];activity=[];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(im,url):
 p=PUBLIC/url;p.parent.mkdir(parents=True,exist_ok=True);im.save(p,format='WEBP',lossless=True,method=4)
 return {'url':url,'pixelSize':list(im.size),'pixelDensity':4,'sha256':sha(p)}
def static(im,source,url):assets.append({'source':source,'enabled':True,**save(im,url)})
icons=json.loads((ICONS/'manifest.json').read_text())
for item in icons['assets']:
 im=Image.open(ICONS/item['candidate']).convert('RGBA');reg=item['previewRegistration'];w,h=item['originalSize'];canvas=Image.new('RGBA',(w*4,h*4));sized=im.resize((round(reg['width']*4),round(reg['height']*4)),Image.Resampling.LANCZOS);canvas.alpha_composite(sized,(round(reg['left']*4),round(reg['top']*4)));static(canvas,f"assets/ui/{item['name']}.png",f"{PREFIX}/ui/{item['name']}.webp")
review=json.loads((REVIEW/'manifest.json').read_text())
for item in review['statics']:
 im=Image.open(REVIEW/item['candidate']).convert('RGBA');native=list(im.size)
 if 'artRect'in item:x,y,w,h=item['artRect'];im=im.crop((x,y,x+w,y+h));native=list(im.size)
 source=item['original'].replace('originals/','assets/')
 # The review stores flat original filenames; runtime layout is explicit.
 source='assets/ui/card-rail.png' if item['id']=='card-rail' else 'assets/companies/calculator.png'
 logical=(800,136) if item['id']=='card-rail' else (346,266);url=f"{PREFIX}/"+source.removeprefix('assets/').replace('.png','.webp');static(im.resize((logical[0]*4,logical[1]*4),Image.Resampling.LANCZOS),source,url);assets[-1]['nativePixelSize']=native
for c in review['clips']:
 if c['sequence']>9:continue
 seen={}
 for i,p in enumerate(c['candidateTimeline']):
  pose=c['candidatePoses'][p];im=Image.open(REVIEW/pose['url']).convert('RGBA');digest=hashlib.sha256(im.tobytes()).hexdigest();url=seen.get(digest)
  if url is None:url=f"{PREFIX}/activities/{c['id']}/{i+1}.webp";seen[digest]=url;info=save(im,url)
  assets.append({'source':f"assets/activities/{c['id']}/{i+1}.png",'enabled':True,'url':url,'pixelSize':list(im.size),'pixelDensity':4,'sha256':sha(PUBLIC/url)})
wm=json.loads((PUBLIC/'assets/world/manifest.json').read_text());am=json.loads((PUBLIC/'assets/activities/manifest.json').read_text())
def animated(c,base,group):
 alias={'barrier-3':'barrier-1','barrier-4':'barrier-2'}.get(c['id'],c['id']);im=Image.open(REVIEW/'motion-v2/animations'/f'{alias}.webp');states=[];end=0
 for k in range(im.n_frames):im.seek(k);im.load();end+=im.info['duration'];states.append((end,im.convert('RGBA').copy()))
 frames=[];seen={};j=0
 for i in range(c['frameCount']*2):
  t=i*1000/60
  while j<len(states)-1 and t>=states[j][0]-1e-6:j+=1
  # Preserve indexed 60fps samples; WebP integer durations must not be resampled at 16.666ms.
  rgba=states[i][1] if len(states)==c['frameCount']*2 else states[j][1];digest=hashlib.sha256(rgba.tobytes()).hexdigest();url=seen.get(digest)
  if url is None:url=f"{PREFIX}/{group}/{alias}/{i+1}.webp";seen[digest]=url;runtime.append(save(rgba,url))
  pad=4 if c['id']=='mine' else 0;f=base['frames'][0];frame={'url':url,'width':rgba.width//4,'height':rgba.height//4,'offsetX':f['offsetX']-pad,'offsetY':f['offsetY']-pad}
  if group=='activities':frame.update(sourceFrame=i+1,fields=[])
  frames.append(frame)
 return {**base,'fps':60,'frames':frames}
for c in review['clips']:
 if c['sequence']==10 or c['id']=='mine':world.append(animated(c,next(x for x in wm['clips'] if x['id']==c['id']),'world'))
 if c['id'].startswith('carnival-ball-'):activity.append(animated(c,next(x for x in am['clips'] if x['id']==c['id']),'activities'))
result={'version':1,'approval':{'date':'2026-10-28','statement':'行，1-12通过，合并到主分支，然后分析13-17怎么做，做个计划','mineRevision':4},'assets':assets,'runtimeImages':runtime,'worldClips':world,'activityClips':activity}
(ROOT/'src/modern/data/approved-non-character.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
referenced={a['url'] for a in [*assets,*runtime]}
for p in OUT.rglob('*.webp'):
 if str(p.relative_to(PUBLIC)) not in referenced:p.unlink()
print(json.dumps({'mappedPaths':len(assets),'runtimeImages':len(runtime),'worldClips':len(world),'activityClips':len(activity),'runtimeBytes':sum(p.stat().st_size for p in OUT.rglob('*.webp'))}))
