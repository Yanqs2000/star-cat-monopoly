"""Package 18/19/21 lossless frames and sampled metadata; source gameplay stays30Hz."""
from pathlib import Path
from PIL import Image
import json,hashlib,math,subprocess,sys,os,http.server,threading,functools
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'public/hd-review/non-character-18-21';P=ROOT/'public/modern';CACHE=ROOT/'.analysis-cache/18-21/render'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def matrix(a,b,t):
 if t==0:return a
 angle=math.atan2(a[1],a[0]);other=math.atan2(b[1],b[0]);angle+=math.atan2(math.sin(other-angle),math.cos(other-angle))*t
 def decompose(m):
  sx=math.hypot(m[0],m[1]);return sx,(m[0]*m[3]-m[1]*m[2])/sx,(m[0]*m[2]+m[1]*m[3])/sx
 da=decompose(a);db=decompose(b);sx,sy,shear=[x+(y-x)*t for x,y in zip(da,db)];co=math.cos(angle);si=math.sin(angle)
 return [co*sx,si*sx,co*shear-si*sy,si*shear+co*sy]
def placements(a,b,t):
 out=[]
 for p in a:
  other=next((q for q in b if q['name']==p['name']),p)
  out.append({**p,'x':p['x']+(other['x']-p['x'])*t,'y':p['y']+(other['y']-p['y'])*t,'matrix':matrix(p['matrix'],other['matrix'],t)})
 return out
def main():
 subprocess.run([sys.executable,'scripts/configure-continuous-artwork.py'],check=True,cwd=ROOT)
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')));threading.Thread(target=server.serve_forever,daemon=True).start()
 try:subprocess.run(['node','scripts/render-continuous-artwork.mjs',str(CACHE)],check=True,cwd=ROOT,env={**os.environ,'CONTINUOUS_REVIEW_URL':f'http://127.0.0.1:{server.server_port}/hd-review/non-character-18-21/render.html'})
 finally:server.shutdown();server.server_close()
 config=json.loads((R/'motion-config.json').read_text());original=json.loads((P/'assets/activities/manifest.json').read_text());index={'version':1,'status':'pending-user-art-review','scope':[18,19,21],'deferred':[20],'sourceSha256':config['sourceSha256'],'activityClips':[],'runtimeImages':[]};qa=[]
 for id,c in config['clips'].items():
  base=next(c for c in original['clips']if c['id']==id);frames=[];seen={};hashes=[];areas=[]
  for i in range(c['count']):
   im=Image.open(CACHE/id/f'{i+1}.png').convert('RGBA');bounds=im.getchannel('A').getbbox();density=c['density']
   trim=(0,0,*im.size)if not id.startswith('car')or i==0 else bounds or(0,0,density,density)
   trim=(trim[0]//density*density,trim[1]//density*density,min(im.width,math.ceil(trim[2]/density)*density),min(im.height,math.ceil(trim[3]/density)*density))
   cropped=im.crop(trim);digest=hashlib.sha256(cropped.tobytes()).hexdigest();url=seen.get(digest);hashes.append(hashlib.sha256(im.tobytes()).hexdigest());areas.append(bounds)
   if url is None:
    url=f'hd-static/continuous-18-21/{id}/{i+1}.webp';dest=P/url;dest.parent.mkdir(parents=True,exist_ok=True);cropped.save(dest,format='WEBP',lossless=True,method=4);seen[digest]=url
    index['runtimeImages'].append({'url':url,'source':url,'pixelSize':list(cropped.size),'pixelDensity':density,'sha256':sha(dest)})
   before=base['frames'][min(len(base['frames'])-1,i//(2 if c['fps']==60 else 1))]
   frames.append({**before,'sourceFrame':i+1,'url':url,'width':cropped.width//density,'height':cropped.height//density,'offsetX':c['offsetX']+trim[0]/density,'offsetY':c['offsetY']+trim[1]/density})
  index['activityClips'].append({**base,'fps':c['fps'],'frames':frames});qa.append({'id':id,'frames':len(frames),'uniqueVisibleFrames':len(set(hashes)),'uniqueTextures':len(seen),'sourceDurationMs':c['sourceFrames']/30*1000,'density':density})
 dice=next(c for c in original['clips']if c['id']=='ludo-dice');frames=[]
 for i in range(80):
  a=dice['frames'][i//2];b=dice['frames'][min(39,i//2+1)];frames.append({**a,'sourceFrame':i+1,'url':'assets-hd/activities/ludo-dice/1.webp','placements':placements(a.get('placements',[]),b.get('placements',[]),(i%2)/2)})
 index['activityClips'].append({**dice,'fps':60,'frames':frames})
 (ROOT/'src/modern/data/continuous-non-character.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
 (R/'runtime-index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
 static=json.loads((ROOT/'src/modern/data/static-hd-assets.json').read_text())
 face_urls={a['source']:a['url'] for a in static['assets']if a.get('enabled')}
 review={'sourceClips':[c for c in original['clips']if c['id']in ['show2','show-npc4','car1','car2','ludo-dice']],'faces':{}}
 aliases=json.loads((ROOT/'src/modern/data/animation-frame-aliases.json').read_text())
 for c in review['sourceClips']:
  key=f"assets/activities/{c['id']}"
  for i,f in enumerate(c['frames']):f['url']=f"{key}/{aliases[key][i]}.png"
 for face in range(1,7):
  for kind in ['face','shadow']:
   key=f'ludo-{kind}-{face}';c=next(c for c in original['clips']if c['id']==key);review['faces'][key]={'frame':c['frames'][0],'hd':face_urls[c['frames'][0]['url']]}
 (R/'review-data.json').write_text(json.dumps(review,ensure_ascii=False,separators=(',',':'))+'\n')
 total=sum((P/x['url']).stat().st_size for x in index['runtimeImages']);decoded=sum(x['pixelSize'][0]*x['pixelSize'][1]*4 for x in index['runtimeImages'])
 (R/'verification.json').write_text(json.dumps({'status':'generated; verification pending','scope':[18,19,21],'deferred':[20],'clips':qa,'runtimeBytes':total,'decodedRgbaBytes':decoded},indent=2)+'\n')
 print('runtime',len(index['runtimeImages']),'bytes',total,'decodedRGBA',decoded)
if __name__=='__main__':main()
