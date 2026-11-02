"""Read native manifests; no edits to source PNGs or runtime routing."""
from pathlib import Path
from collections import Counter
import json,hashlib,argparse
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'
NAMES={5:'大牌',8:'大尾',9:'阿飞',3:'吉吉&米米',4:'佳佳',7:'帅戈',11:'怪卡',6:'薇薇',10:'阿杰',12:'妮妮'}

def audit(cid):
 base=ROOT/f'public/modern/assets/characters/{cid}'
 walk=json.loads((base/'manifest.json').read_text())
 reactions=json.loads((base/'reactions/manifest.json').read_text())
 activities=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
 ids={f'face-{cid}',f'head-{cid}',*[f'fly-{cid}-{i}'for i in range(1,5)],f'carnival-boy-{cid}',f'carnival-walk-{cid}-left',f'carnival-walk-{cid}-right'}
 frames=[];clips=[]
 def add(frame,group,swf,**metadata):
  path=ROOT/'public/modern'/frame['url']
  with Image.open(path)as im:size=list(im.size)
  frames.append({**frame,'group':group,'sourceSwf':swf,**metadata,'pixelSize':size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 for clip in walk['clips']:
  for f in clip['frames']:add(f,'walk',f'star{cid}.swf',facing=clip['facing'],sourceSymbol=clip['sourceSpriteId'])
 for clip in reactions['clips']:
  for f in clip['frames']:add(f,'reaction',f'star{cid}.swf',facing=clip['facing'],action=clip['name'],fps=clip['fps'],sourceSymbol=clip['sourceSymbol'])
 for god in reactions['godOverlays']:add(god,'god',f'star{cid}.swf')
 for clip in activities['clips']:
  if clip['id']not in ids:continue
  clips.append(clip)
  for f in clip['frames']:add(f,'activity','play.swf',clipId=clip['id'],fps=clip.get('fps'),sourceSymbol=clip.get('sourceSymbol'))
 add({'url':f'assets/monthly/champions/{cid}.png'},'monthly','play.swf')
 counts=dict(Counter(f['group']for f in frames));counts['total']=len(frames)
 data={'roleId':cid,'name':NAMES[cid],'anatomy':{3:'paired',4:'crab',6:'floating',7:'floating',10:'floating',12:'floating',8:'scorpion',9:'centaur'}.get(cid,'biped'),'counts':counts,'activityIds':sorted(ids),'swfs':{n:hashlib.sha256((ROOT/'public/original'/n).read_bytes()).hexdigest()for n in[f'star{cid}.swf','play.swf']},'frames':frames}
 (REVIEW/f'role-{cid:02d}-material-sources.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 # Only a contact sheet for inspecting native activity identity and props.
 samples=[]
 for clip in clips:
  if clip['id'].startswith('carnival-walk'):continue
  for f in clip['frames']:samples.append((clip['id'],f['url']))
 samples.append(('monthly',f'assets/monthly/champions/{cid}.png'))
 sheet=Image.new('RGB',(1600,((len(samples)+3)//4)*410),'#e4e9ee');draw=ImageDraw.Draw(sheet)
 for i,(label,url)in enumerate(samples):
  art=Image.open(ROOT/'public/modern'/url).convert('RGBA');art=art.crop(art.getbbox());factor=min(370/art.width,355/art.height)
  art=art.resize((round(art.width*factor),round(art.height*factor)),Image.Resampling.NEAREST)
  x=(i%4)*400+(400-art.width)//2;y=(i//4)*410+40
  sheet.paste(art,(x,y),art);draw.text(((i%4)*400+12,(i//4)*410+10),label,fill='#101010')
 sheet.save(REVIEW/f'source-references/role-{cid:02d}-activities.png')
 print(json.dumps({'role':cid,**counts},ensure_ascii=False))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--role',type=int,choices=[3,4,5,7,8,9,11,6,10,12],required=True);audit(p.parse_args().role)
