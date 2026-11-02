"""Derived whole-character materials; complete sources stay separately packed."""
from pathlib import Path
import json,copy,hashlib,argparse,importlib.util
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'

def build(cid):
 stem={5:'dapai',8:'dawei',9:'afei',3:'jjmm',4:'jiajia',7:'shuaige',11:'guaika',6:'weiwei',10:'ajie',12:'nini'}[cid];role=f'role-{cid:02d}'
 out=ROOT/f'public/modern/hd-characters/characters-25/{role}'
 batch='dapai-dawei-afei'if cid in[5,8,9]else'jjmm-jiajia-shuaige'if cid in[3,4,7]else'ajie-nini'if cid in[10,12]else'guaika-weiwei'
 rasters=Path(f'/tmp/starcat-{batch}/role-{cid}/material-renders')
 author=json.loads((REVIEW/f'{role}-authoring.json').read_text())
 spec=importlib.util.spec_from_file_location('layers',ROOT/'scripts/build-characters25.py');layers=importlib.util.module_from_spec(spec);spec.loader.exec_module(layers)
 data=json.loads((ROOT/f'src/modern/data/{stem}-map-rig.json').read_text())
 native=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
 def clip(name):return next(c for c in native['clips']if c['id']==name)
 data['assets']=[];data['activityClips']=[];metadata={}
 def save(name,image,density,source=None):
  path=out/(name+'.webp');image.save(path,lossless=True,method=6);url=str(path.relative_to(ROOT/'public/modern'))
  entry=dict(url=url,source=url,pixelSize=list(image.size),pixelDensity=density,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
  metadata[url]=entry
  if source:data['assets'].append({**entry,'source':source,'enabled':True})
  return url
 def fit(image,size,pad=0):
  image=image.convert('RGBA');image=image.crop(image.getbbox());factor=min((size[0]-pad*2)/image.width,(size[1]-pad*2)/image.height)
  image=image.resize((max(1,round(image.width*factor)),max(1,round(image.height*factor))),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',size);canvas.alpha_composite(image,((size[0]-image.width)//2,(size[1]-image.height)//2));return canvas
 carnival=json.loads((ROOT/f'src/modern/data/{stem}-carnival.json').read_text())
 head=carnival['characters'][0]['facings']['down-right']['actors'][0]['parts']['head']
 if author.get('portraitLayers'):
  art=Image.new('RGBA',tuple(author['portraitCanvas']))
  for layer in author['portraitLayers']:
   image=layers.split_views(Image.open(REVIEW/layer['master']),*layer['layout'])[layer['index']]
   x0,y0,x1,y1=layer['box'];art.alpha_composite(fit(image,(x1-x0,y1-y0)),(x0,y0))
 else:art=layers.split_views(Image.open(REVIEW/author['portraitMaster']),*author.get('portraitLayout',[4,1]))[author.get('portraitAtlasIndex',0)]if author.get('portraitMaster')else Image.open(ROOT/'public/modern'/head['url'])
 for name,density in [('face',4),('head',2)]:
  original=clip(f'{name}-{cid}');frame=original['frames'][0]
  url=save(name,fit(art,(frame['width']*density,frame['height']*density)),density,frame['url'])
  replacement=copy.deepcopy(original);replacement['frames'][0]['url']=url;data['activityClips'].append(replacement)
 champion=f'assets/monthly/champions/{cid}.png';size=Image.open(ROOT/'public/modern'/champion).size
 champion_art=Image.open(REVIEW/author['championMaster'])if author.get('championMaster')else Image.open(rasters/'champion.png')
 save('champion',fit(champion_art,size,6),1,champion)
 thumb=Image.open(rasters/'thumbnail.png').convert('RGBA');thumb=thumb.crop(thumb.getbbox());data['thumbnailUrls']={str(cid):save('thumbnail',thumb,6)}
 flying=layers.split_views(Image.open(REVIEW/author.get('flightMaster',f'masters/{role}-flight-master-r1.png')),4,1)
 for heading,image in enumerate(flying,1):
  replacement=copy.deepcopy(clip(f'fly-{cid}-{heading}'));frame=replacement['frames'][0]
  frame['url']=save(f'fly-{heading}',fit(image,(frame['width']*3,frame['height']*3),6),3);data['activityClips'].append(replacement)
 boy=copy.deepcopy(clip(f'carnival-boy-{cid}'))
 for pose,frame in enumerate(boy['frames'],1):
  frame.update(url=save(f'carnival-idle-{pose}',Image.open(rasters/f'carnival-idle-{pose}.png'),4),width=140,height=140,offsetX=-70,offsetY=-125)
 data['activityClips'].append(boy)
 for pose,direction in [(2,'left'),(3,'right')]:
  original=clip(f'carnival-walk-{cid}-{direction}');replacement=copy.deepcopy(original);replacement['fps']=120;replacement['frames']=[]
  frame_count=round(len(original['frames'])/original['fps']*120)
  unique=16 if cid==11 else frame_count
  urls=[save(f'carnival-{direction}-{i}',Image.open(rasters/f'carnival-{pose}-{i}.png'),4)for i in range(unique)]
  for i in range(frame_count):replacement['frames'].append(dict(sourceFrame=i+1,fields=[],url=urls[i%unique],width=140,height=140,offsetX=-70,offsetY=-125))
  data['activityClips'].append(replacement)
 accepted=json.loads((ROOT/'src/modern/data/characters-25.json').read_text())
 for god in [2,3,4,5,10,11]:
  original=f'assets/characters/2/reactions/gods/{god}.png'
  shared=next(a for a in accepted['assets']if a['source']==original)
  entry={**shared,'source':f'assets/characters/{cid}/reactions/gods/{god}.png'};data['assets'].append(entry)
  metadata[entry['url']]=next(i for i in accepted['runtimeImages']if i['url']==entry['url'])
 data['runtimeImages']+=list(metadata.values())
 inventory=json.loads((REVIEW/f'{role}-material-sources.json').read_text())
 data['derivation']=dict(identity=cid,nativeInventoryCount=inventory['counts']['total'],carnivalNativeFps=30,carnivalArtworkFps=120,carnivalWorldStride=carnival['characters'][0]['stridePx']if cid in[3,4,5,7,8,9,10,12]else 32,method='Canonical articulated rigs, complete same-identity heads and hidden surfaces, flight master, accepted shared possession badges. Native physics/RNG/clocks preserved.')
 for path in [ROOT/f'src/modern/data/{stem}-complete.json',REVIEW/f'{role}-complete.json']:path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(dict(role=cid,staticRoutes=len(data['assets']),activityClips=len(data['activityClips']),runtimeImages=len(data['runtimeImages']))))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--role',type=int,choices=[3,4,5,7,8,9,11,6,10,12],required=True);build(p.parse_args().role)
