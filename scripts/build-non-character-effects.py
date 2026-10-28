"""Render source-timed continuous VFX in Chrome; package trimmed lossless RGBA frames."""
from pathlib import Path
from PIL import Image
import json,hashlib,subprocess,os,sys,threading,http.server,functools
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'public/hd-review/non-character-13-17';P=ROOT/'public/modern';CACHE=ROOT/'.analysis-cache/effects-render';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
subprocess.run([sys.executable,str(ROOT/'scripts/configure-non-character-effects.py')],check=True,cwd=ROOT)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:subprocess.run(['node','scripts/render-non-character-effects.mjs',str(CACHE)],check=True,cwd=ROOT,env={**os.environ,'EFFECTS_REVIEW_URL':f'http://127.0.0.1:{server.server_port}/hd-review/non-character-13-17/'})
finally:server.shutdown();server.server_close()
config=json.loads((R/'motion-config.json').read_text());world=json.loads((P/'assets/world/manifest.json').read_text());activity=json.loads((P/'assets/activities/manifest.json').read_text());index={'version':1,'status':'pending-user-art-review','sourceSha256':config['sourceSha256'],'worldClips':[],'activityClips':[],'runtimeImages':[]};qa=[];runtimeFiles=set()
for id,c in config['clips'].items():
 base=next(x for x in world['clips']+activity['clips']if x['id']==id);frames=[];full=[];seen={};hashes=[];alphaAreas=[];packedBytes=0
 for i in range(c['count']):
  im=Image.open(CACHE/id/f'{i+1:04}.png').convert('RGBA');full.append(im);digest=hashlib.sha256(im.tobytes()).hexdigest();hashes.append(digest);alpha=im.getchannel('A');bounds=alpha.getbbox();alphaAreas.append(int(np.count_nonzero(np.asarray(alpha))));trim=(0,0,*im.size)if id=='fog' or i==0 else bounds or (0,0,4,4)
  # Trim on the logical-pixel grid so registration remains exact at every density.
  trim=(trim[0]//4*4,trim[1]//4*4,min(im.width,(trim[2]+3)//4*4),min(im.height,(trim[3]+3)//4*4));cropped=im.crop(trim);key=hashlib.sha256(cropped.tobytes()).hexdigest();url=seen.get(key)
  if url is None:
   url=f'hd-static/effects-13-17/{id}/{i+1}.webp';seen[key]=url;dest=P/url;dest.parent.mkdir(parents=True,exist_ok=True);cropped.save(dest,format='WEBP',lossless=True,method=4);index['runtimeImages'].append({'url':url,'source':url,'pixelSize':list(cropped.size),'pixelDensity':4,'sha256':sha(dest)});packedBytes+=dest.stat().st_size
  runtimeFiles.add(url);frame={'url':url,'width':cropped.width//4,'height':cropped.height//4,'offsetX':c['offsetX']+trim[0]/4,'offsetY':c['offsetY']+trim[1]/4}
  if id=='fog':frame.update(sourceFrame=i+1,fields=[])
  frames.append(frame)
  with Image.open(P/url)as decoded:
   a=np.asarray(cropped);b=np.asarray(decoded.convert('RGBA'));assert np.array_equal(a[:,:,3],b[:,:,3]);assert np.array_equal(a[:,:,:3][a[:,:,3]>0],b[:,:,:3][a[:,:,3]>0])
  reconstructed=Image.new('RGBA',im.size);reconstructed.paste(Image.open(P/url).convert('RGBA'),(trim[0],trim[1]));a=np.asarray(im);b=np.asarray(reconstructed);assert np.array_equal(a[:,:,3],b[:,:,3]);assert np.array_equal(a[:,:,:3][a[:,:,3]>0],b[:,:,:3][a[:,:,3]>0])
 duration=[round((i+1)*1000/60)-round(i*1000/60)for i in range(c['count'])];(R/'animations').mkdir(exist_ok=True);full[0].save(R/'animations'/f'{id}.webp',save_all=True,append_images=full[1:],duration=duration,loop=1,lossless=True,method=4)
 clip={**base,'fps':60,'frames':frames};index['activityClips'if id=='fog'else'worldClips'].append(clip)
 longest=run=1
 for i in range(1,len(hashes)):run=run+1 if hashes[i]==hashes[i-1]else 1;longest=max(longest,run)
 decodedBytes=sum((P/url).exists()*next(v['pixelSize'][0]*v['pixelSize'][1]*4 for v in index['runtimeImages']if v['url']==url)for url in set(seen.values()))
 row={'id':id,'frames':c['count'],'fps':60,'durationMs':c['count']/60*1000,'uniqueFullFrames':len(set(hashes)),'longestRepeatedRunIncludingIntentionalBlanks':longest,'alphaAreas':alphaAreas,'finalAlphaArea':alphaAreas[-1],'fullEndTransparent':not Image.open(CACHE/id/'end.png').getchannel('A').getbbox(),'pixelReconstructionExact':True,'runtimeBytes':packedBytes,'decodedRgbaBytes':decodedBytes,'runtimeFiles':len(set(seen.values()))};qa.append(row);print(id,{k:row[k]for k in ['frames','uniqueFullFrames','finalAlphaArea','runtimeBytes','decodedRgbaBytes']})
 # Frame endpoints inherit source disappearance: once-only visuals must leave no retained last-frame sprite.
 assert row['fullEndTransparent'] and row['finalAlphaArea']==0,id
prefix=P/'hd-static/effects-13-17'
for p in prefix.rglob('*.webp'):
 if str(p.relative_to(P))not in runtimeFiles:p.unlink()
(ROOT/'src/modern/data/non-character-effects.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n');render=json.loads((CACHE/'browser-render-verification.json').read_text());(R/'verification.json').write_text(json.dumps({'status':'technical-verification; pending-art-acceptance','sourceSha256':config['sourceSha256'],'clips':qa,'browserRender':render,'runtimeImages':len(index['runtimeImages']),'runtimeBytes':sum(x['runtimeBytes']for x in qa),'decodedRgbaBytes':sum(x['decodedRgbaBytes']for x in qa)},indent=2)+'\n')
print('Frames reconstructed exactly; original01-12 manifest untouched.')
