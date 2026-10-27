"""Exact source-rectangle subtraction for review; never edit alpha or artwork."""
import sys,json
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m

def subtract(box,hole):
 x,y,r,b=box;hx,hy,hr,hb=hole;a,c=max(x,hx),min(r,hr);t,d=max(y,hy),min(b,hb)
 if a>=c or t>=d:return [box]
 return [v for v in [(x,y,r,t),(x,d,r,b),(x,t,a,d),(c,t,r,d)] if v[0]<v[2] and v[1]<v[3]]

def main():
 out=m.WORK/'reviews/batch-23';rows=json.load(open(out/'regions.json'));approved=json.load(open(out/'approved-review-regions.json'));overlays=[r for r in rows if r.get('drawAfterApproved')];draw=[];sources=[r for r in rows if not r.get('drawAfterApproved')]+approved;holes=[]
 for r in overlays:
  x,y,w,h=r['logicalRect'];holes.append((round((x-640)*m.DENSITY),round((y-420)*m.DENSITY),round((x+w-640)*m.DENSITY),round((y+h-420)*m.DENSITY)))
 for row in sources:
  source=m.ROOT/'public/modern'/row['url'];im=Image.open(source).convert('RGBA');x,y,w,h=row['logicalRect'];assert row['pixelDensity']==m.DENSITY;ox,oy=round((x-640)*m.DENSITY),round((y-420)*m.DENSITY);box=(ox,oy,ox+im.width,oy+im.height);parts=[box]
  for hole in holes:parts=[p for v in parts for p in subtract(v,hole)]
  if parts==[box]:draw.append(row);continue
  for i,(a,b,c,d) in enumerate(parts):
   crop=(a-ox,b-oy,c-ox,d-oy);part=im.crop(crop);label=row.get('label',row.get('tileId'))+f'-retained-{i}';path=out/(label+'.webp');part.save(path,lossless=True,exact=True,method=6);assert np.array_equal(np.array(part),np.array(Image.open(path).convert('RGBA')));lx,ly=640+a/m.DENSITY,420+b/m.DENSITY;r=dict(row);r.update(label=label,url=str(path.relative_to(m.ROOT/'public/modern')),logicalRect=[lx,ly,part.width/m.DENSITY,part.height/m.DENSITY],scenePosition=[lx-184,ly-313],pixelSize=list(part.size),sha256=m.sha(path),sourceUncarvedUrl=row['url'],sourcePixelCrop=list(crop),sourceUncarvedSha256=m.sha(source));draw.append(r)
 draw+=overlays;(out/'draw-regions.json').write_text(json.dumps(draw,indent=2)+'\n');print(json.dumps({'uncarvedRegions':len(rows),'approvedParts':len(approved),'replacementPatches':len(overlays),'drawRegions':len(draw),'retainedExactSourceCrops':sum('sourcePixelCrop' in r for r in draw)}))
if __name__=='__main__':main()
