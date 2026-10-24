"""Review-only native source selection. No RGB painting, blending or alpha repair."""
from pathlib import Path
import json,sys
import numpy as np
from PIL import Image,ImageDraw
sys.path.insert(0,'scripts');import produce_hd_map as m
P=m.ROOT/'.analysis-cache/map-continuation-20261023-batch28';rect=(1280,1680,464,400);x0,y0,w,h=rect
size=(m.px(x0+w)-m.px(x0),m.py(y0+h)-m.py(y0));old=Image.new('RGBA',size)
rows=json.loads((m.WORK/'reviews/batch-27/draw-regions.json').read_text())
for r in rows:
 x,y,rw,rh=r['logicalRect']
 if x+rw<=x0 or x>=x0+w or y+rh<=y0 or y>=y0+h:continue
 im=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');old.alpha_composite(im,(m.px(x)-m.px(x0),m.py(y)-m.py(y0)))
a=np.array(old);b=a.copy();mask=np.zeros(a.shape[:2],bool);sources=[]
for name,rr,shift,span in [('lower',(1280,1832,288,248),-1,(1332,1488)),('upper',(1456,1680,288,248),0,(1488,1690))]:
 path=m.WORK/f'repairs/south-bridge-empty-{name}-r1/master.png';raw=Image.open(path).convert('RGBA');sx,sy,sw,sh=rr
 assert min(raw.width/sw,raw.height/sh)>=4
 native=raw.resize((m.px(sx+sw)-m.px(sx),m.py(sy+sh)-m.py(sy)),Image.Resampling.LANCZOS);n=np.array(native)

 nx=m.px(sx)-m.px(x0);ny=m.py(sy+shift)-m.py(y0);sources.append(dict(name=name,source=str(path),sourcePixelSize=list(raw.size),referenceRect=list(rr),registrationY=shift,selectedX=list(span)))
 for ix in range(m.px(span[0])-m.px(x0),m.px(span[1])-m.px(x0)):
  wx=640+(ix+m.px(x0))/m.DENSITY;guess=1901-(wx-1420)*.714
  ys=np.arange(max(0,m.py(guess-16)-m.py(y0)),min(a.shape[0],m.py(guess+36)-m.py(y0)))
  valid=ys[(ys-ny>=0)&(ys-ny<n.shape[0])]
  new=n[valid-ny,ix-nx,:3].astype(int);prev=a[valid,ix,:3].astype(int)
  look=round(8*m.DENSITY)
  valid=valid[(valid+look<a.shape[0])&(valid-ny+look<n.shape[0])]
  new=n[valid-ny,ix-nx,:3].astype(int);prev=a[valid,ix,:3].astype(int)
  nroad=n[valid-ny+look,ix-nx,:3].astype(int);oroad=a[valid+look,ix,:3].astype(int)
  ni=valid[(new.max(1)-new.min(1)<45)&(new.mean(1)>190)&(nroad.max(1)-nroad.min(1)<40)&(nroad.mean(1)>80)&(nroad.mean(1)<180)]
  oi=valid[(prev.max(1)-prev.min(1)<45)&(prev.mean(1)>190)&(oroad.max(1)-oroad.min(1)<40)&(oroad.mean(1)>80)&(oroad.mean(1)<180)]
  if not len(ni) or not len(oi):continue
  top=int(ni[0])-2;oldcurb=int(oi[0]);low=max(top+round(8*m.DENSITY),oldcurb+round(8*m.DENSITY));high=min(low+round(10*m.DENSITY),ny+n.shape[0]-1)
  # Choose an existing native RGB cut in the shared asphalt, no feather or recolor.
  choices=np.arange(low,high)
  diff=np.abs(a[choices,ix,:3].astype(int)-n[choices-ny,ix-nx,:3].astype(int)).mean(1)
  cut=int(choices[diff.argmin()])
  validrows=np.arange(top,cut)
  b[validrows,ix]=n[validrows-ny,ix-nx];mask[validrows,ix]=True
Image.fromarray(a).save(P/'bridge-native-before.png');Image.fromarray(b).save(P/'bridge-native-candidate.png');Image.fromarray(mask.astype('uint8')*255).save(P/'bridge-source-selection.png')
assert np.array_equal(a[~mask],b[~mask]);assert (b[:,:,3]==a[:,:,3]).all()
Image.fromarray(b).resize((1392,1200),Image.Resampling.LANCZOS).save(P/'bridge-preview.png')
(P/'bridge-source-selection.json').write_text(json.dumps({'rect':rect,'pixelDensity':m.DENSITY,'sources':sources,'selectedPixels':int(mask.sum()),'outsideSelectionIdentical':True,'alphaUnchanged':True,'status':'review-only-not-installed'},indent=2))
print('Review candidate assembled; runtime unchanged.')
