"""Archive native identity/timing references without touching any original."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/hd-review/characters-25'
FACINGS=['down-right','down-left','up-left','up-right']
NAMES=['卷毛','阿牛','吉吉&米米','佳佳','大牌','薇薇','帅戈','大尾','阿飞','阿杰','怪卡','妮妮']

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def build():
 refs=OUT/'source-references';refs.mkdir(parents=True,exist_ok=True)
 roles=[]
 for cid in range(2,13):
  base=ROOT/f'public/modern/assets/characters/{cid}'
  source=json.loads((base/'reactions/manifest.json').read_text());walk=json.loads((base/'manifest.json').read_text())
  role={'id':cid,'name':NAMES[cid-1],'anatomy':{3:'paired',4:'crab',6:'floating',7:'floating',8:'scorpion',9:'centaur',12:'floating'}.get(cid,'biped'),
        'sourceSwfSha256':sha(ROOT/f'public/original/star{cid}.swf'),'sourceManifestSha256':sha(base/'manifest.json'),
        'sourceReactionManifestSha256':sha(base/'reactions/manifest.json'),'facings':{}}
  sheet=Image.new('RGB',(2048,2080),'#edf1f5');draw=ImageDraw.Draw(sheet)
  for col,facing in enumerate(FACINGS):
   wc=next(c for c in walk['clips']if c['facing']==facing)
   definition={'durationsMs':{'walk':sum(f['durationMs']for f in wc['frames'])},'walkFrameCount':len(wc['frames']),'sourceReferences':{}}
   for clip in [c for c in source['clips']if c['facing']==facing]:
    definition['durationsMs'][clip['name']]=len(clip['frames'])*1000/clip['fps']
   for row,action in enumerate(['neutral','happy','sad','hurt']):
    clip=next(c for c in source['clips']if c['facing']==facing and c['name']==action)
    index=0 if action=='neutral'else min(len(clip['frames'])-1,round(len(clip['frames'])*(.8 if action=='hurt'else .6)))
    frame=clip['frames'][index];p=ROOT/'public/modern'/frame['url'];image=Image.open(p).convert('RGBA')
    definition['sourceReferences'][action]={'frame':index+1,'url':frame['url'],'sha256':sha(p),'bounds':[frame['offsetX'],frame['offsetY'],frame['width'],frame['height']]}
    # Reference enlargement only: preserve every source pixel, including the
    # original floor shadow. The generation prompt excludes that shadow.
    bbox=image.getbbox();image=image.crop(bbox)
    scale=min(480/image.width,470/image.height)
    image=image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.NEAREST)
    x=col*512+(512-image.width)//2;y=row*520+40+(470-image.height)//2
    sheet.paste(image,(x,y),image.getchannel('A'));draw.text((col*512+12,row*520+12),f'star{cid} / {facing} / {action} / source {index+1}',fill='black')
   role['facings'][facing]=definition
  path=refs/f'role-{cid:02d}-source.png';sheet.save(path)
  role['referenceImage']=str(path.relative_to(ROOT));role['referenceSha256']=sha(path);roles.append(role)
 (OUT/'source-index.json').write_text(json.dumps({'version':1,'scope':[25],'baseCommit':'20d9c55','sourceTiming':'Native manifests; frames and duration are independent per identity/facing/action.','roles':roles},ensure_ascii=False,indent=2)+'\n')
 (ROOT/'src/modern/data/characters-25-source.json').write_text(json.dumps({r['id']:{f:d['durationsMs']for f,d in r['facings'].items()}for r in roles},ensure_ascii=False,indent=2)+'\n')
 print('Native references and exact source timing archived for11 identities')

if __name__=='__main__':build()
