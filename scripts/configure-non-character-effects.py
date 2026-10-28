"""Extract stable texture rectangles and source animation geometry; never repaint masters."""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'public/hd-review/non-character-13-17'
m=json.loads((R/'source-timeline.json').read_text());m['sourceSha256']=hashlib.sha256((ROOT/'public/original/play.swf').read_bytes()).hexdigest();(R/'source-timeline.json').write_text(json.dumps(m,indent=2)+'\n');sprites={s['symbol']:s for s in m['sprites']}
def bounds(file,region=None):
 im=Image.open(R/file).convert('RGBA');x,y,w,h=region or (0,0,*im.size);b=im.crop((x,y,x+w,y+h)).getchannel('A').point(lambda v:255 if v>=8 else 0).getbbox();return [x+b[0],y+b[1],b[2]-b[0],b[3]-b[1]]
masters={'cardFront':{'url':'13-card-textures-r1.png','rect':bounds('13-card-textures-r1.png',(0,0,768,1024))},'cardBack':{'url':'13-card-textures-r1.png','rect':bounds('13-card-textures-r1.png',(768,0,768,1024))},'coin':{'url':'14-gold-coin-r1.png','rect':bounds('14-gold-coin-r1.png')},'smoke':{'url':'15-smoke-puff-r1.png','rect':bounds('15-smoke-puff-r1.png')},'rocket':{'url':'17-rocket-body-r1.png','rect':bounds('17-rocket-body-r1.png')}}
world=json.loads((ROOT/'public/modern/assets/world/manifest.json').read_text());activity=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text());clips={}
for id,symbol,sequence in [('card-gain',1163,13),('ticket-gain',1185,14),('fog',391,15),('explosion',1026,16),('rocket',1079,17)]:
 c=next(c for c in world['clips']+activity['clips']if c['id']==id);f=c['frames'][0];timeline=sprites[symbol]['timeline'];track=[];last=None
 for i,layer in enumerate(timeline):
  if not layer:continue
  p=layer[0]
  if id in ['card-gain','ticket-gain']:
   child=sprites[1162 if id=='card-gain' else 1184]['timeline'][i%30][0]['bounds'];q={'frame':i,'x':p['matrix'][4]+(child[0]+child[2])/2,'y':p['matrix'][5]+(child[1]+child[3])/2,'alpha':p['alpha'],'h':child[3]-child[1]}
  else:
   x0,y0,x1,y1=p['bounds'];tx,ty=p['matrix'][4:6];root=(-122,-115)if id=='fog'else(-300,-244.65)if id=='explosion'else(34.45,27.35);q={'frame':i,'x':(x0+x1)/2+tx+root[0],'y':(y0+y1)/2+ty+root[1],'w':x1-x0,'h':y1-y0,'alpha':p['alpha']}
  payload={k:v for k,v in q.items()if k!='frame'}
  if payload!=last:track.append(q);last=payload
 clips[id]={'id':id,'sequence':sequence,'sourceSymbol':c['sourceSymbol'],'sourceFps':30,'sourceFrames':len(c['frames']),'fps':60,'count':len(c['frames'])*2,'width':f['width'],'height':f['height'],'offsetX':f['offsetX'],'offsetY':f['offsetY'],'track':track,'sourceFramesData':c['frames']}
(R/'motion-config.json').write_text(json.dumps({'version':1,'sourceSha256':m['sourceSha256'],'masters':masters,'clips':clips},ensure_ascii=False,indent=2)+'\n');print({k:v['rect']for k,v in masters.items()})
