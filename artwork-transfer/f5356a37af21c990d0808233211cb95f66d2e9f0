"""User-authorized geometric registration of existing GPT artwork; gameplay is unchanged."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json,sys
sys.path.insert(0,'scripts');import produce_hd_map as m
P=m.ROOT/'.analysis-cache/map-continuation-20261023-batch29';old=Image.open(m.WORK/'reviews/batch-28/bridge-native-before.png').convert('RGBA');a=np.array(old);h,w=a.shape[:2];x0,y0=1280,1680
# Original/installed curb landmarks measured in the independent review.
xs=np.array([1336,1350,1380,1420,1460,1500,1540,1580,1600,1620,1632],float)
source=np.array([1964,1957,1939,1915,1889,1860,1831,1801,1787,1772,1763],float)
shift=np.array([0,6,9,14,17,16,17,14,7,0,0],float)
wx=640+(np.arange(w)+m.px(x0))/m.DENSITY;wy=420+(np.arange(h)+m.py(y0))/m.DENSITY
XX,YY=np.meshgrid(wx,wy)
# Convex color silhouettes retain the disc itself without including adjacent old curb.
def hull(points):
 points=sorted(set(points))
 def cross(o,p,q):return (p[0]-o[0])*(q[1]-o[1])-(p[1]-o[1])*(q[0]-o[0])
 low=[];high=[]
 for p in points:
  while len(low)>1 and cross(low[-2],low[-1],p)<=0:low.pop()
  low.append(p)
 for p in reversed(points):
  while len(high)>1 and cross(high[-2],high[-1],p)<=0:high.pop()
  high.append(p)
 return low[:-1]+high[:-1]
protected_image=Image.new('L',(w,h),0);pd=ImageDraw.Draw(protected_image);rgb=a[:,:,:3].astype(int)
for name,cx,cy,rx,ry in [('cyan',1507,1899,34,25),('green',1556,1867,35,26),('blue',1610,1831,35,26),('cyan',1663,1794,35,26)]:
 roi=((XX-cx)/rx)**2+((YY-cy)/ry)**2<1.05
 color=(rgb[:,:,0]<170)&(rgb.max(2)-rgb.min(2)>70)
 if name=='cyan':color&=(rgb[:,:,1]>130)&(rgb[:,:,2]>140)
 elif name=='green':color&=(rgb[:,:,1]>140)&(rgb[:,:,1]>rgb[:,:,2]+20)
 else:color&=(rgb[:,:,2]>145)&(rgb[:,:,2]>rgb[:,:,1]+30)
 ys0,xs0=np.where(roi&color);pd.polygon(hull(list(zip(xs0.tolist(),ys0.tolist()))),fill=255)
protected=np.array(protected_image.filter(ImageFilter.MaxFilter(19)))>0
out=a.copy();source_y=np.tile(np.arange(h,dtype=float)[:,None],(1,w));active=np.zeros((h,w),bool)
for ix,x in enumerate(wx):
 if not xs[0]<x<xs[-1]:continue
 top=np.interp(x,xs,source);delta=np.interp(x,xs,shift)
 knots=np.array([top-55,top-delta-2,top-delta+7,top+17,top+22]);sknots=np.array([top-55,top-2,top+7,top+17,top+22])
 sy=np.interp(wy,knots,sknots);use=(wy>knots[0])&(wy<knots[-1]);fy=(sy-420)*m.DENSITY-m.py(y0)
 lo=np.clip(np.floor(fy).astype(int),0,h-1);hi=np.minimum(lo+1,h-1);frac=np.clip(fy-lo,0,1)
 values=np.rint(a[lo,ix].astype(float)*(1-frac[:,None])+a[hi,ix].astype(float)*frac[:,None]).astype('uint8')
 out[use,ix]=values[use];source_y[use,ix]=fy[use];active[use,ix]=True
# Restore a native-scale asphalt field below the displaced curb; do not stretch grain.
# The donor is an unchanged clean asphalt rectangle from the installed generated road.
ix0,iy0=m.px(1390)-m.px(x0),m.py(1960)-m.py(y0)
donor=a[iy0:iy0+64,ix0:ix0+96].copy()
assert (donor[:,:,:3].max(2)-donor[:,:,:3].min(2)).max()<45
fill=np.zeros((h,w),bool)
for ix,x in enumerate(wx):
 if not xs[0]<x<xs[-1]:continue
 top=np.interp(x,xs,source);delta=np.interp(x,xs,shift);newtop=top-delta
 if delta<.01:continue
 for iy in np.where((wy>=newtop+6)&(wy<top+22))[0]:
  if protected[iy,ix]:continue
  # Fade only inside gray road, leaving stone and original disc pixels untouched.
  edge=min((wy[iy]-(newtop+6))/2,(top+22-wy[iy])/5,1)
  strength=max(0,edge)*min(1,delta/3)
  rgb=donor[iy%donor.shape[0],ix%donor.shape[1]]
  out[iy,ix,:3]=np.rint(out[iy,ix,:3]*(1-strength)+rgb[:3]*strength).astype('uint8')
  fill[iy,ix]=True
out[protected]=a[protected]
assert np.array_equal(out[protected],a[protected]);assert np.array_equal(out[~active],a[~active]);assert out[:,:,3].min()>=a[:,:,3].min()
Image.fromarray(out).save(P/'bridge-registered.png');Image.fromarray(out).resize((1392,1200),Image.Resampling.LANCZOS).save(P/'bridge-registered-preview.png')
Image.fromarray(protected.astype('uint8')*255).save(P/'protected-discs.png')
(P/'registration.json').write_text(json.dumps({'rect':[1280,1680,464,400],'pixelDensity':m.DENSITY,'source':'batch27 native composite','xAnchors':xs.tolist(),'sourceUpperY':source.tolist(),'upwardShift':shift.tolist(),'protectedDiscPixels':int(protected.sum()),'protectedDiscsUnchanged':True,'outsideWarpUnchanged':True,'roadDonorFillPixels':int(fill.sum()),'status':'review-only'},indent=2))
print('Registered preview written; runtime unchanged.')
