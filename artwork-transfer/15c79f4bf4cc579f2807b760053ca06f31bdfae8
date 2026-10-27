"""Replay real native sources at fade/foreground anchors against the overview."""
from pathlib import Path
import hashlib,json,math
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/modern'
MANIFEST=PUBLIC/'hd-map/full-map-v1/manifest.json'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def replay_patch(rows,x,y,w=32,h=32):
 d=4.3515625
 # Keep source pixels around the sample for the downsampling filter.
 gx,gy=math.floor((x-640)*d)-16,math.floor((y-420)*d)-16
 right,bottom=math.ceil((x+w-640)*d)+16,math.ceil((y+h-420)*d)+16
 patch=Image.new('RGBA',(right-gx,bottom-gy))
 for row in rows:
  rx,ry,rw,rh=row['logicalRect'];sx,sy=round((rx-640)*d),round((ry-420)*d)
  ex,ey=sx+row['pixelSize'][0],sy+row['pixelSize'][1]
  a,b,c,e=max(gx,sx),max(gy,sy),min(right,ex),min(bottom,ey)
  if a>=c or b>=e:continue
  with Image.open(PUBLIC/row['url']) as source:
   part=source.convert('RGBA').crop((a-sx,b-sy,c-sx,e-sy))
   patch.alpha_composite(part,(a-gx,b-gy))
 box=((x-640)*d-gx,(y-420)*d-gy,(x+w-640)*d-gx,(y+h-420)*d-gy)
 return patch.resize((w*2,h*2),Image.Resampling.LANCZOS,box=box)

def verify():
 manifest=json.loads(MANIFEST.read_text());recipe=manifest['recipe']
 assert manifest['logicalSize']==[2700,2552] and manifest['reviewStatus'] in ['approved','installed-pending-user-review']
 graph=ROOT/recipe['sourceDrawGraph'];assert sha(graph)==recipe['sourceDrawGraphSha256']
 rows=json.loads(graph.read_text());regions=manifest['mapRegions'];sources=manifest['provenance']
 assert len(rows)==len(regions)==len(sources)==manifest['regionCount']
 assert sha(ROOT/recipe['script'])==recipe['scriptSha256']
 for row,region,source in zip(rows,regions,sources):
  expected=row.get('sha256',row.get('outputSha256'))
  assert sha(PUBLIC/row['url'])==expected==source['sourceSha256']==source['outputSha256']==region['outputSha256']
  assert source['nativeRgbaUnchanged'] and sha(PUBLIC/region['path'])==expected
  assert region['pixelSize']==row['pixelSize'] and region['scenePosition']==row['scenePosition']
  assert np.allclose(region['logicalRect'],row['logicalRect'],rtol=0,atol=.000001)
  assert region['pixelDensity']==row['pixelDensity'] and region['pixelDensity']>=4
  assert region['reviewStatus']==manifest['reviewStatus']
 assert sum(bool(row.get('spriteOnBase')) for row in rows)==4
 assert all(row.get('spriteOnBase') for row in rows[-4:])
 base=PUBLIC/manifest['baseMap']['path'];assert sha(base)==manifest['baseMap']['outputSha256']
 differences=[]
 with Image.open(base) as image:
  assert image.size==(5400,5104)
  for x,y in [(640,500),(1120,500),(768,900),(1000,420),(416,1710)]:
   actual=np.array(image.crop((x*2,y*2,(x+32)*2,(y+32)*2)).convert('RGBA')).astype(int)
   expected=np.array(replay_patch(rows,x,y)).astype(int);delta=int(np.abs(actual-expected).max())
   assert delta<=2,f'Overview differs from native layers at{x},{y}: maximumRGBA delta{delta}'
   differences.append({'worldSample':[x,y,32,32],'maximumRgbaDifference':delta})
 return {'nativeRegions':len(regions),'nativeRegionFilesByteIdentical':len(regions),'nativeForegroundSprites':4,
  'basePixelSize':[5400,5104],'overviewLayerReplay':differences,'originalApprovedFilesModified':False}

if __name__=='__main__':print(json.dumps(verify(),ensure_ascii=False))
