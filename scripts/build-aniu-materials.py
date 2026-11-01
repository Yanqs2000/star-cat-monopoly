"""Pack A-Niu's existing masters; no image generation or external API calls."""
from pathlib import Path
import base64,io,json,copy,hashlib,argparse,importlib.util
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'
OUT=ROOT/'public/modern/hd-characters/characters-25/role-02'
RASTERS=Path('/tmp/starcat-characters-25/material-renders')
PREFIX='hd-characters/characters-25/role-02/'
s=importlib.util.spec_from_file_location('layers',ROOT/'scripts/build-characters25.py');layers=importlib.util.module_from_spec(s);s.loader.exec_module(layers)
native=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
def clip(cid):return next(c for c in native['clips']if c['id']==cid)
def fit(image,size,pad=0):
 image=image.convert('RGBA');image=image.crop(image.getbbox());factor=min((size[0]-pad*2)/image.width,(size[1]-pad*2)/image.height)
 image=image.resize((max(1,round(image.width*factor)),max(1,round(image.height*factor))),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',size);canvas.alpha_composite(image,((size[0]-image.width)//2,(size[1]-image.height)//2));return canvas
def uri(image):
 stream=io.BytesIO();image.save(stream,format='PNG');return'data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode()

def prepare():
 OUT.mkdir(parents=True,exist_ok=True)
 crops={3:(0,0,170,165),5:(95,88,212,217),10:(19,0,135,165),11:(47,0,173,160)}
 letters={2:'财',3:'穷',4:'福',5:'衰',10:'天',11:'魔'}
 colors={3:'#b4aa8d',5:'#a3aaa8',10:'#66b9ed',11:'#b52028'}
 for god in[2,3,4,5,10,11]:
  source=ROOT/f'public/modern/hd-characters/npc-23/mini-npc-{god}.webp';im=Image.open(source).convert('RGBA')
  native_god=next(g for g in json.loads((ROOT/'public/modern/assets/characters/2/reactions/manifest.json').read_text())['godOverlays']if g['godId']==god)
  w,h=native_god['width'],native_god['height'];font='Songti SC,STSong,serif'
  if god in[2,4]:
   art=f'<image href="{uri(im)}" x="2" y="0" width="{w-4}" height="{h-5}" preserveAspectRatio="xMidYMid meet"/>'
   art+=f'<text x="{w/2}" y="{h-1}" text-anchor="middle" font-family="{font}" font-size="27" font-weight="900" fill="#ffe029" stroke="#231b05" stroke-width="2.5" paint-order="stroke fill">{letters[god]}</text>'
  else:
   im=im.crop(crops[god]);color=colors[god]
   art=f'<defs><clipPath id="face"><circle cx="25" cy="35" r="16.8"/></clipPath></defs><circle cx="25" cy="35" r="18.2" fill="#fff" stroke="{color}" stroke-width="1.4"/>'
   art+=f'<image href="{uri(im)}" x="7.5" y="17.5" width="35" height="35" preserveAspectRatio="xMidYMid meet" clip-path="url(#face)"/>'
   art+=f'<circle cx="13" cy="11" r="10" fill="#fff" stroke="{color}" stroke-width="1"/><text x="13" y="16.3" text-anchor="middle" font-family="{font}" font-size="16" font-weight="900" fill="#141414">{letters[god]}</text>'
  (OUT/f'god-{god}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*3}" height="{h*3}" viewBox="0 0 {w} {h}">{art}</svg>')
 print('Six source-registered badges prepared from accepted NPC23 artwork and scalable text; only A-Niu routes will change')

def finalize():
 data=json.loads((ROOT/'src/modern/data/aniu-map-rig.json').read_text())
 # Starting again from the canonical rig is safe: derived entries are
 # replaced by URL rather than accumulated over repeated packing runs.
 base_urls={p['url']for f in data['characters'][0]['facings'].values()for a in f['actors']for p in a['parts'].values()}
 data['runtimeImages']=[p for p in data['runtimeImages']if p['url']in base_urls]
 data['assets']=[];data['activityClips']=[];metadata={}
 def save(name,image,density,source=None):
  path=OUT/(name+'.webp');image.save(path,lossless=True,method=6);url=PREFIX+path.name
  entry={'url':url,'source':url,'pixelSize':list(image.size),'pixelDensity':density,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
  metadata[url]=entry
  if source:data['assets'].append({**entry,'source':source,'enabled':True})
  return url
 # Face and mini-map head share one frontal mother, never an independent face.
 carnival=json.loads((ROOT/'src/modern/data/aniu-carnival.json').read_text())
 head=carnival['characters'][0]['facings']['down-right']['actors'][0]['parts']['head']
 art=Image.open(ROOT/'public/modern'/head['url'])
 for name,density in [('face',4),('head',2)]:
  original=clip(f'{name}-2');f=original['frames'][0]
  url=save(name,fit(art,(f['width']*density,f['height']*density)),density,f['url'])
  replacement=copy.deepcopy(original);replacement['frames'][0]['url']=url;data['activityClips'].append(replacement)
 champion_size=Image.open(ROOT/'public/modern/assets/monthly/champions/2.png').size
 save('champion',fit(Image.open(RASTERS/'champion.png'),champion_size),1,'assets/monthly/champions/2.png')
 thumb=Image.open(RASTERS/'thumbnail.png').convert('RGBA');thumb=thumb.crop(thumb.getbbox())
 data['thumbnailUrls']={'2':save('thumbnail',thumb,6)}
 flying=layers.split_views(Image.open(REVIEW/'masters/role-02-flight-master-r1.png'),4,1)
 for heading,image in enumerate(flying,1):
  replacement=copy.deepcopy(clip(f'fly-2-{heading}'));frame=replacement['frames'][0]
  frame['url']=save(f'fly-{heading}',fit(image,(frame['width']*3,frame['height']*3),6),3);data['activityClips'].append(replacement)
 boy=copy.deepcopy(clip('carnival-boy-2'))
 for pose,frame in enumerate(boy['frames'],1):
  url=save(f'carnival-idle-{pose}',Image.open(RASTERS/f'carnival-idle-{pose}.png'),4)
  frame.update(url=url,width=140,height=132,offsetX=-70,offsetY=-118)
 data['activityClips'].append(boy)
 for pose,direction in[(2,'left'),(3,'right')]:
  original=clip(f'carnival-walk-2-{direction}');replacement=copy.deepcopy(original);replacement['fps']=120;replacement['frames']=[]
  urls=[save(f'carnival-{direction}-{i}',Image.open(RASTERS/f'carnival-{pose}-{i}.png'),4)for i in range(16)]
  for i in range(64):replacement['frames'].append({'sourceFrame':i+1,'fields':[],'url':urls[i%16],'width':140,'height':132,'offsetX':-70,'offsetY':-118})
  data['activityClips'].append(replacement)
 for god in[2,3,4,5,10,11]:save(f'god-{god}',Image.open(RASTERS/f'god-{god}.png'),3,f'assets/characters/2/reactions/gods/{god}.png')
 data['runtimeImages']+=list(metadata.values())
 data['derivation']={'identity':2,'nativeInventoryCount':1144,'method':'Same canonical map/carnival rigs and flight mother. Shared badges compose accepted NPC23 artwork with native labels. Original physics, RNG and collision geometry remain authoritative.','carnivalNativeFps':30,'carnivalNativeFrames':16,'carnivalArtworkFps':120,'carnivalWorldStride':32,'generationAllowedIds':[2]}
 for path in[ROOT/'src/modern/data/characters-25.json',REVIEW/'role-02-rig.json']:
  path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'staticRoutes':len(data['assets']),'activityClips':len(data['activityClips']),'runtimeImages':len(data['runtimeImages'])}))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('phase',choices=['prepare','finalize']);args=p.parse_args()
 (prepare if args.phase=='prepare'else finalize)()
