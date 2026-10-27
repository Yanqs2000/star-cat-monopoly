"""Package the reviewed native draw graph and a matching two-density overview.

No artwork generation, color painting, alpha repair, or source-silhouette clipping.
Runtime regions copy RGBA exactly. The overview replays their source-over order,
including approved fade underlays and four separate native foreground sprites.
"""
from pathlib import Path
import hashlib,json,math,shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/modern'
WORK=PUBLIC/'hd-masters/map/full-map-v1'
D=4.3515625
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def package(source: Path, output: Path):
 rows=json.loads(source.read_text());assert rows and sum(bool(r.get('spriteOnBase')) for r in rows)==4
 output.mkdir(parents=True,exist_ok=True)
 gx0,gy0=round(-640*D),round(-420*D)
 ox,oy=640+gx0/D,420+gy0/D
 canvas=Image.new('RGBA',(math.ceil((2700-ox)*D),math.ceil((2552-oy)*D)))
 regions=[];provenance=[];labels=set()
 for index,row in enumerate(rows):
  source_image=PUBLIC/row['url'];expected=row.get('sha256',row.get('outputSha256'))
  assert sha(source_image)==expected
  im=Image.open(source_image).convert('RGBA');assert row['pixelDensity']==D
  x,y,w,h=row['logicalRect'];sx=round((x-640)*D)-gx0;sy=round((y-420)*D)-gy0
  canvas.alpha_composite(im,(sx,sy))
  label=row.get('label',row.get('tileId'));assert label and label not in labels;labels.add(label)
  assert x>=-1/D and y>=-1/D
  crop=[0,0,im.width,im.height]
  target=output/f'part-{index:03d}.webp'
  shutil.copy2(source_image,target)
  with Image.open(target) as encoded:assert np.array_equal(np.array(im),np.array(encoded.convert('RGBA')))
  regions.append({'id':label,'path':str(target.relative_to(PUBLIC)),
   'logicalRect':list(row['logicalRect']),'scenePosition':list(row['scenePosition']),
   'pixelSize':list(im.size),'pixelDensity':D,'reviewStatus':'installed-pending-user-review',
   'outputSha256':sha(target),'spriteOnBase':bool(row.get('spriteOnBase'))})
  provenance.append({'id':label,'sourceUrl':row['url'],'sourceSha256':expected,
   'sourcePixelCrop':crop,'outputSha256':sha(target),'nativeRgbaUnchanged':True})
 base=canvas.resize((5400,5104),Image.Resampling.LANCZOS,
  box=(-ox*D,-oy*D,(2700-ox)*D,(2552-oy)*D))
 base_path=output/'base.webp';base.save(base_path,lossless=True,exact=True,method=6)
 with Image.open(base_path) as encoded:assert np.array_equal(np.array(base),np.array(encoded.convert('RGBA')))
 manifest={'version':1,'kind':'full-map','reviewStatus':'installed-pending-user-review',
  'scope':'Complete static main map; character and Blender work excluded.',
  'logicalSize':[2700,2552],'regionCount':len(regions),
  'sourceMapSha256':json.loads((WORK/'generation.json').read_text())['sourceMapSha256'],
  'baseMap':{'path':str(base_path.relative_to(PUBLIC)),'pixelDensity':2,'pixelSize':[5400,5104],'outputSha256':sha(base_path)},
  'mapRegions':regions,'recipe':{'sourceDrawGraph':str(source.relative_to(ROOT)),
   'sourceDrawGraphSha256':sha(source),'sourceGraphRows':len(rows),'nativeForegroundSprites':4,
   'script':'scripts/package_full_hd_map.py','scriptSha256':sha(Path(__file__)),
   'overviewNativeOrigin':[ox,oy],'nativeBoundsRoundingAllowance':1/D,
   'overviewMethod':'Replay native source-over layers, including approved fade underlays and foreground; one fractional-box LANCZOS resize to2x.'},
  'provenance':provenance}
 (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'regions':len(regions),'nativeForegroundSprites':4,'basePixelSize':list(base.size),
  'nativeRegionsUnchanged':len(provenance),
  'manifest':str((output/'manifest.json').relative_to(ROOT))}))

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True)
 parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
 package(args.source.resolve(),args.output.resolve())
