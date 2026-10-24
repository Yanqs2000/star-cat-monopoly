from PIL import Image,ImageDraw,ImageFilter
import json,sys,numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
P=m.ROOT/'.analysis-cache/map-continuation-20261023-batch29';rows=json.loads((m.WORK/'reviews/batch-29/bridge-draw-regions.json').read_text())
def render(rect):
 x0,y0,w,h=rect;out=Image.new('RGBA',(m.px(x0+w)-m.px(x0),m.py(y0+h)-m.py(y0)))
 for r in rows:
  x,y,rw,rh=r['logicalRect']
  if x+rw<=x0 or x>=x0+w or y+rh<=y0 or y>=y0+h:continue
  out.alpha_composite(Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA'),(m.px(x)-m.px(x0),m.py(y)-m.py(y0)))
 return out
rect=[232,1472,72,60];old=render(rect);source=render([2296,949,72,60]).resize(old.size,Image.Resampling.LANCZOS)
mask=Image.new('L',old.size,0);d=ImageDraw.Draw(mask)
# Matching original type28 design, fitted to the existing west disc's footprint.
d.ellipse([m.px(236)-m.px(232),m.py(1476)-m.py(1472),m.px(298)-m.px(232),m.py(1526)-m.py(1472)],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(1.5));new=Image.composite(source,old,mask)
a=np.array(old);b=np.array(new);s=np.array(source);ma=np.array(mask);assert np.array_equal(a[ma==0],b[ma==0]);assert np.array_equal(s[ma==255],b[ma==255]);assert np.array_equal(a[:,:,3],b[:,:,3])
old.save(P/'west-red-before.png');source.save(P/'east-red-source.png');new.save(P/'west-red-unified.png');mask.save(P/'red-disc-selection.png')
canvas=Image.new('RGBA',(old.width*3,old.height));canvas.paste(old,(0,0));canvas.paste(new,(old.width,0));canvas.paste(source,(old.width*2,0));canvas.save(P/'red-disc-comparison.png')
(P/'red-disc-registration.json').write_text(json.dumps({'rect':rect,'sourceRect':[2296,949,72,60],'nativeDensity':m.DENSITY,'sameGameType':28,'sourceTile':203,'targetTile':204,'sourceDesign':'Existing eastern GPT-generated motif retained; no invented interpretation of blurry original','fullySelectedPixels':int((ma==255).sum()),'fullySelectedRgbaExactlyMatchesSource':True,'outsideSelectionUnchanged':True,'alphaUnchanged':True},indent=2))
