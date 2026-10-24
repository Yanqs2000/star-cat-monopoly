from pathlib import Path
from PIL import Image
import json,hashlib,shutil,sys
sys.path.insert(0,'scripts');import produce_hd_map as m
P=m.ROOT/'.analysis-cache/map-continuation-20261023-batch29';R=m.WORK/'reviews/batch-29';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if not (R/'red-draw-regions.json').exists():shutil.copy2(R/'draw-regions.json',R/'red-draw-regions.json')
for name in ['normalize_grass.py','grass-normalization.json','grass-before.png','grass-normalized.png','grass-region-mask.png','grass-comparison.png']:shutil.copy2(P/name,R/name)
source=R/'west-grass-normalized.webp';im=Image.open(R/'grass-normalized.png').convert('RGBA');im.save(source,lossless=True,exact=True,method=6)
x0,y0=m.px(288),m.py(688);hole=(x0,y0,x0+im.width,y0+im.height)
def subtract(b,h):
 x,y,r,bt=b;hx,hy,hr,hb=h;l,rr=max(x,hx),min(r,hr);t,bb=max(y,hy),min(bt,hb)
 if l>=rr or t>=bb:return [b]
 return [v for v in [(x,y,r,t),(x,bb,r,bt),(x,t,l,bb),(rr,t,r,bb)] if v[0]<v[2] and v[1]<v[3]]
rows=json.loads((R/'red-draw-regions.json').read_text());draw=[];sprites=[]
for row in rows:
 if row.get('spriteOnBase'):sprites.append(row);continue
 x,y,w,h=row['logicalRect'];ox,oy=m.px(x),m.py(y);iw,ih=row['pixelSize'];parts=subtract((ox,oy,ox+iw,oy+ih),hole)
 if parts==[(ox,oy,ox+iw,oy+ih)]:draw.append(row);continue
 src=m.ROOT/'public/modern'/row['url'];image=Image.open(src).convert('RGBA')
 for i,(a,b,c,d) in enumerate(parts):
  crop=[a-ox,b-oy,c-ox,d-oy];part=image.crop(crop);label=row.get('label',row.get('tileId'))+f'-grass-retained-{i}';path=R/(label+'.webp');part.save(path,lossless=True,exact=True,method=6);lx,ly=640+a/m.DENSITY,420+b/m.DENSITY
  r=dict(row);r.update(label=label,url=str(path.relative_to(m.ROOT/'public/modern')),logicalRect=[lx,ly,part.width/m.DENSITY,part.height/m.DENSITY],scenePosition=[lx-184,ly-313],pixelSize=list(part.size),sha256=sha(path),sourceUncarvedUrl=row['url'],sourceUncarvedLabel=row.get('label',row.get('tileId')),sourcePixelCrop=crop,sourceUncarvedSha256=sha(src));draw.append(r)
lx,ly=640+x0/m.DENSITY,420+y0/m.DENSITY
draw.append({'label':'west-grass-native-normalized-b29','url':str(source.relative_to(m.ROOT/'public/modern')),'logicalRect':[lx,ly,im.width/m.DENSITY,im.height/m.DENSITY],'scenePosition':[lx-184,ly-313],'pixelSize':list(im.size),'pixelDensity':m.DENSITY,'sha256':sha(source),'spriteOnBase':False,'registrationRecipe':'reviews/batch-29/normalize_grass.py','sourceArtifact':'reviews/batch-29/grass-before.png','userAuthorizedProgrammaticRegistration':True})
draw+=sprites;(R/'draw-regions.json').write_text(json.dumps(draw,indent=2)+'\n');print(len(draw))
