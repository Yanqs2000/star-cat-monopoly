"""User-authorized material correction; suppress medium-scale checker shading, retain leaf detail."""
from PIL import Image,ImageDraw,ImageFilter
import json,sys,numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
P=m.ROOT/'.analysis-cache/map-continuation-20261023-batch29';R=m.WORK/'reviews/batch-29';rows=json.loads((R/'red-draw-regions.json').read_text());rect=[288,688,384,432];x0,y0,w,h=rect
im=Image.new('RGBA',(m.px(x0+w)-m.px(x0),m.py(y0+h)-m.py(y0)))
for r in rows:
 x,y,rw,rh=r['logicalRect']
 if x+rw<=x0 or x>=x0+w or y+rh<=y0 or y>=y0+h:continue
 im.alpha_composite(Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA'),(m.px(x)-m.px(x0),m.py(y)-m.py(y0)))
a=np.array(im);mask=Image.new('L',im.size,0);d=ImageDraw.Draw(mask);conv=lambda p:(m.px(p[0])-m.px(x0),m.py(p[1])-m.py(y0))
poly=[(300,688),(410,688),(453,835),(420,865),(414,945),(528,994),(627,1034),(640,1090),(435,1100),(340,1020),(300,940),(285,810)]
d.polygon([conv(p) for p in poly],fill=255)
# Exclude the existing tree/platform and their outlines/shadows.
d.ellipse([conv((410,858)),conv((493,957))],fill=0);d.polygon([conv(p) for p in [(460,850),(540,825),(672,940),(672,1040),(550,990)]],fill=0)
allowed=np.array(mask)>0;mask=mask.filter(ImageFilter.GaussianBlur(8*m.DENSITY));a0=a[:,:,:3].astype(float)
green=(a0[:,:,1]>100)&(a0[:,:,1]>a0[:,:,0]*1.05)&(a0[:,:,1]>a0[:,:,2]*1.7)&(a[:,:,3]>240)
def normalized_blur(sigma):
 weight=Image.fromarray(green.astype('uint8')*255).filter(ImageFilter.GaussianBlur(sigma*m.DENSITY));den=np.maximum(np.array(weight).astype(float),1)
 channels=[]
 for c in range(3):
  channel=Image.fromarray((a0[:,:,c]*green).astype('uint8')).filter(ImageFilter.GaussianBlur(sigma*m.DENSITY));channels.append(np.array(channel).astype(float)*255/den)
 return np.stack(channels,axis=2)
fine=normalized_blur(1.25);broad=normalized_blur(12)
alpha=np.array(mask)/255*green*allowed;corrected=np.clip(a0+(broad-fine)*alpha[:,:,None],0,255);b=a.copy();b[:,:,:3]=np.rint(corrected).astype('uint8')
assert np.array_equal(a[alpha==0],b[alpha==0]);assert np.array_equal(a[:,:,3],b[:,:,3])
im.save(P/'grass-before.png');Image.fromarray(b).save(P/'grass-normalized.png');mask.save(P/'grass-region-mask.png')
canvas=Image.new('RGBA',(im.width*2,im.height));canvas.paste(im,(0,0));canvas.paste(Image.fromarray(b),(im.width,0));canvas.resize((1152,648),Image.Resampling.LANCZOS).save(P/'grass-comparison.png')
(P/'grass-normalization.json').write_text(json.dumps({'rect':rect,'pixelDensity':m.DENSITY,'mediumScaleSigmaLogical':1.25,'broadLightingSigmaLogical':12,'strength':1,'polygon':poly,'unchangedAlpha':True,'outsideSelectionUnchanged':True,'source':'installed GPT native draw graph','status':'review-only'},indent=2))
