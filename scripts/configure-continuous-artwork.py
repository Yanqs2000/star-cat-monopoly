"""Read original geometry and fixed masters for 18/19/21. Never changes source art."""
from pathlib import Path
import json,math,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
R=ROOT/'public/hd-review/non-character-18-21'
source=json.loads((R/'source-timeline.json').read_text())
sprites={s['symbol']:s for s in source['sprites']}
activities=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
masters={}
for key,file in [('panel','19-notice-panel-r3-opaque.png'),('police','21-police-r2.png'),('ambulance','21-ambulance-r1.png')]:
 im=Image.open(R/file).convert('RGBA');b=im.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
 masters[key]={'url':file,'rect':[b[0],b[1],b[2]-b[0],b[3]-b[1]],'sha256':hashlib.sha256((R/file).read_bytes()).hexdigest()}
clips={}
angles={868:0,871:0,873:-20,875:-38,876:0,879:0,881:20,883:10,845:0,848:0,850:-12,852:-28,853:-12,860:0,862:20,864:10}
for id,symbol in [('show2',1472),('show-npc4',1479),('car1',884),('car2',865)]:
 c=next(c for c in activities['clips'] if c['id']==id)
 f=c['frames'][0];track=[]
 if id.startswith('car'):
  for i,layers in enumerate(sprites[symbol]['timeline']):
   body=layers[0];x0,y0,x1,y1=body['bounds'];tx,ty=body['matrix'][4:6]
   if body['symbol'] in [868,845]:y0=0
   extras=[x for x in layers[1:] if x['symbol']!=844]
   flare=next((x for x in layers if x['symbol']==844),None)
   if body['symbol'] in [868,845]:
    nested=next(x for x in sprites[body['symbol']]['timeline'][0] if x['symbol']==844)
    flare={**nested,'matrix':[*nested['matrix'][:4],tx+nested['matrix'][4],ty+nested['matrix'][5]]}
   door=0
   if extras:
    door=max(0,min(1,(tx-extras[0]['matrix'][4])/21)) if id=='car1' else max(0,min(1,((extras[0]['bounds'][2]-extras[0]['bounds'][0])-10)/46))
   hatch=None
   if id=='car2' and extras:
    e=extras[0];hx0,hy0,hx1,hy1=e['bounds'];ex,ey=e['matrix'][4:6];hatch=[ex+hx0,ey+hy0,hx1-hx0,hy1-hy0]
   track.append({'frame':i,'x':tx+(x0+x1)/2,'y':ty+(y0+y1)/2,'w':x1-x0,'h':y1-y0,
    'angle':angles.get(body['symbol'],0),'door':door,'hatch':hatch,
    'flare':{'matrix':flare['matrix'],'alpha':flare['alpha']} if flare else None})
 clips[id]={'id':id,'sourceSymbol':symbol,'sourceFrames':len(c['frames']),'fps':60 if id.startswith('car') else 30,
  'count':len(c['frames'])*(2 if id.startswith('car') else 1),'width':f['width'],'height':f['height'],
  'offsetX':f['offsetX'],'offsetY':f['offsetY'],'track':track,'density':2 if id.startswith('car') else 4}
(R/'motion-config.json').write_text(json.dumps({'version':1,'sourceSha256':hashlib.sha256((ROOT/'public/original/play.swf').read_bytes()).hexdigest(),'masters':masters,'clips':clips},indent=2)+'\n')
print('18 uses approved dynamic dice faces; 19 keeps intentional source holds; 20 deferred; 21 fixed masters.')
