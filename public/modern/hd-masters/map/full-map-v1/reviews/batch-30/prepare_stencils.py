from pathlib import Path
from PIL import Image,ImageFilter
from collections import deque
import numpy as np,json
P=Path(__file__).parent;original=Image.open('public/modern/assets/map.png').convert('L');specs={'upper':([1120,820,80,70],[1155,853]),'lower':([1140,902,70,62],[1176,930])}
def components(mask):
 mask=mask.copy();H,W=mask.shape;out=[]
 for y,x in zip(*np.where(mask)):
  if not mask[y,x]:continue
  q=deque([(y,x)]);mask[y,x]=False;pts=[]
  while q:
   yy,xx=q.popleft();pts.append((yy,xx))
   for ny,nx in [(yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)]:
    if 0<=ny<H and 0<=nx<W and mask[ny,nx]:mask[ny,nx]=False;q.append((ny,nx))
  if len(pts)>20:out.append(pts)
 return out
report={}
for name,(rect,center) in specs.items():
 x,y,w,h=rect;im=original.crop((x,y,x+w,y+h)).filter(ImageFilter.GaussianBlur(.45));mask=Image.fromarray((np.array(im)>232).astype('uint8')*255).filter(ImageFilter.MedianFilter(3));comps=components(np.array(mask)>0)
 # Prefer the central paint component, excluding curbs touching the crop frame.
 candidates=[]
 for pts in comps:
  ys,xs=zip(*pts);cx=np.mean(xs)+x;cy=np.mean(ys)+y;dist=(cx-center[0])**2+(cy-center[1])**2
  candidates.append((dist,pts))
 pts=min(candidates,key=lambda q:q[0])[1];selected=np.zeros((h,w),'uint8')
 for yy,xx in pts:selected[yy,xx]=255
 mask=Image.fromarray(selected);mask.save(P/f'{name}-original-stencil.png');mask.resize((w*8,h*8),Image.Resampling.NEAREST).save(P/f'{name}-original-stencil-preview.png')
 yy,xx=np.where(selected);report[name]={'referenceRect':rect,'paintBounds':[int(xx.min()+x),int(yy.min()+y),int(xx.max()+x),int(yy.max()+y)],'paintPixels':len(pts),'centroid':[float(xx.mean()+x),float(yy.mean()+y)],'threshold':232,'gaussianRadius':.45,'medianSize':3}
(P/'stencils.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
