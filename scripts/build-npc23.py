"""Derive item23 icons from item22, and pack native opaque narrative masters."""
from pathlib import Path
import hashlib,json
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-22-23'

def opaque_panel(image,source,density=2):
 image=image.convert('RGBA')
 if image.getchannel('A').getextrema()!=(255,255):
  raise ValueError('Narrative master must be natively opaque, not repaired by alpha filling')
 target=image.resize((source.width*density,source.height*density),Image.Resampling.LANCZOS)
 # Source-authored exterior rounded outline; the generated RGB interior stays opaque.
 target.putalpha(source.convert('RGBA').getchannel('A').resize(target.size,Image.Resampling.LANCZOS))
 return target

def build():
 activities=json.loads((ROOT/'public/modern/assets/activities/manifest.json').read_text())
 npc=json.loads((ROOT/'src/modern/data/npc-22.json').read_text())
 result={'version':1,'status':'candidate-awaiting-user-review','scope':[23],'deferred':[20],
  'activityClips':[],'runtimeImages':[]}
 provenance=[]
 def install(clip,image,source):
  url='hd-characters/npc-23/'+clip['id']+'.webp'
  path=ROOT/'public/modern'/url;path.parent.mkdir(parents=True,exist_ok=True)
  image.save(path,format='WEBP',lossless=True,method=4)
  frames=[{**f,'url':url}for f in clip['frames']]
  result['activityClips'].append({**clip,'frames':frames})
  result['runtimeImages'].append({'url':url,'source':url,'pixelDensity':2,'pixelSize':list(image.size),
   'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  provenance.append({'id':clip['id'],**source,'outputSha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 for id in [2,3,4,5,9,10,11,12,13,14,15]:
  clip=next(c for c in activities['clips']if c['id']=='mini-npc-'+str(id))
  source=Image.open(ROOT/'public/modern'/clip['frames'][0]['url']).convert('RGBA')
  bbox=source.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
  body=next(c for c in npc['worldClips']if c['id']=='npc-'+str(id))['frames'][0]
  input_path=ROOT/'public/modern'/body['url']
  canonical=Image.open(input_path).convert('RGBA')
  canonical=canonical.crop(canonical.getchannel('A').getbbox())
  image=Image.new('RGBA',(source.width*2,source.height*2))
  width,height=(bbox[2]-bbox[0])*2,(bbox[3]-bbox[1])*2
  # Same accepted-for-review canonical body, with original minimap registration.
  resized=canonical.convert('RGBa').resize((width,height),Image.Resampling.LANCZOS).convert('RGBA')
  image.alpha_composite(resized,(bbox[0]*2,bbox[1]*2))
  install(clip,image,{'method':'canonical item22 body with source icon bounds',
   'canonical':body['url'],'canonicalSha256':hashlib.sha256(input_path.read_bytes()).hexdigest(),'sourceAlphaBounds':bbox})
 for id in [9,12,13,14,15,23]:
  clip=next(c for c in activities['clips']if c['id']=='trait-'+str(id))
  original=Image.open(ROOT/'public/modern'/clip['frames'][0]['url'])
  master=REVIEW/f'trait-{id}-opaque-r2.png';image=opaque_panel(Image.open(master),original)
  assert image.getchannel('A').crop((110*2,18*2,390*2,48*2)).getextrema()==(255,255)
  install(clip,image,{'method':'native opaque built-in-imagegen master; source exterior clipping only',
   'master':master.relative_to(ROOT).as_posix(),'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),
   'sourceFrames':60,'sourceFps':30,'uniqueRuntimeTextures':1})
 (ROOT/'src/modern/data/npc-23.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 (REVIEW/'npc-23-runtime.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
 (REVIEW/'npc-23-verification.json').write_text(json.dumps({'status':'candidate-unaccepted','scope':[23],
  'items':provenance,'files':len(result['runtimeImages']),
  'decodedRgbaBytes':sum(i['pixelSize'][0]*i['pixelSize'][1]*4 for i in result['runtimeImages'])},indent=2)+'\n')
 print('Item23: eleven derived icons and six native opaque narrative holds')
if __name__=='__main__':build()
