from PIL import Image,ImageDraw,ImageFilter
import numpy as np

def clean_outline(source,round_corners=True):
 a=np.array(source)>0;H,W=a.shape;edges={}
 for y,x in zip(*np.where(a)):
  for absent,p,q in [(y==0 or not a[y-1,x],(x,y),(x+1,y)),(x==W-1 or not a[y,x+1],(x+1,y),(x+1,y+1)),(y==H-1 or not a[y+1,x],(x+1,y+1),(x,y+1)),(x==0 or not a[y,x-1],(x,y+1),(x,y))]:
   if absent:edges.setdefault(p,[]).append(q)
 loops=[]
 while edges:
  start=next(iter(edges));p=start;loop=[p]
  while True:
   q=edges[p].pop()
   if not edges[p]:del edges[p]
   p=q
   if p==start:break
   loop.append(p)
  loops.append(loop)
 def area(poly):return sum(p[0]*q[1]-p[1]*q[0] for p,q in zip(poly,poly[1:]+poly[:1]))/2
 def simplify(pts,eps=1.0):
  if len(pts)<=2:return pts
  p=np.array(pts[0],float);q=np.array(pts[-1],float);v=q-p;length=np.linalg.norm(v)
  dist=[abs(v[0]*(r[1]-p[1])-v[1]*(r[0]-p[0]))/length if length else np.linalg.norm(np.array(r)-p) for r in pts]
  k=int(np.argmax(dist))
  return simplify(pts[:k+1],eps)[:-1]+simplify(pts[k:],eps) if dist[k]>eps else [pts[0],pts[-1]]
 out=Image.new('L',(W*8,H*8),0);d=ImageDraw.Draw(out)
 for loop in sorted(loops,key=lambda p:abs(area(p)),reverse=True):
  if abs(area(loop))<2:continue
  mid=len(loop)//2;poly=simplify(loop[:mid+1])[:-1]+simplify(loop[mid:]+loop[:1])[:-1]
  rounded=[]
  for p,q in zip(poly,poly[1:]+poly[:1]):rounded.extend([(.8*p[0]+.2*q[0],.8*p[1]+.2*q[1]),(.2*p[0]+.8*q[0],.2*p[1]+.8*q[1])])
  d.polygon([((x-.5)*8,(y-.5)*8) for x,y in (rounded if round_corners else poly)],fill=255 if area(loop)>0 else 0)
 return out.filter(ImageFilter.MaxFilter(5))
