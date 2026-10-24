from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json,sys
from prepare_stencils import components
from vector_stencil import clean_outline
sys.path.insert(0,'scripts');import produce_hd_map as m
P=Path(__file__).parent;rect=[1104,816,112,160];x0,y0,w,h=rect;old=Image.new('RGBA',(m.px(x0+w)-m.px(x0),m.py(y0+h)-m.py(y0)))
rows=json.loads((m.WORK/'reviews/batch-29/draw-regions.json').read_text());used=[]
for r in rows:
 x,y,rw,rh=r['logicalRect']
 if x+rw<=x0 or x>=x0+w or y+rh<=y0 or y>=y0+h:continue
 old.alpha_composite(Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA'),(m.px(x)-m.px(x0),m.py(y)-m.py(y0)));used.append({'id':r.get('label',r.get('tileId')),'url':r['url'],'rect':r['logicalRect']})
a=np.array(old);rgb=a[:,:,:3].astype(int);white=(rgb.min(2)>210)&(rgb.max(2)-rgb.min(2)<35);comps=components(white);remove=Image.new('L',old.size,0);rr=np.array(remove);selected=[]
for tx,ty in [(1152,859),(1176,942)]:
 scores=[]
 for pts in comps:
  yy,xx=zip(*pts);cx=np.mean(xx)/m.DENSITY+x0;cy=np.mean(yy)/m.DENSITY+y0;scores.append(((cx-tx)**2+(cy-ty)**2,pts,cx,cy))
 _,pts,cx,cy=min(scores,key=lambda v:v[0]);selected.append([cx,cy,len(pts)])
 for yy,xx in pts:rr[yy,xx]=255
remove=Image.fromarray(rr).filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(1.2))
# Clone only the asphalt grain underneath the two old painted marks.
donor=a[m.py(833)-m.py(y0):m.py(845)-m.py(y0),m.px(1106)-m.px(x0):m.px(1120)-m.px(x0)].copy();assert (donor[:,:,:3].max(2)-donor[:,:,:3].min(2)).max()<45
H,W=a.shape[:2];tile=donor[np.arange(H)[:,None]%donor.shape[0],np.arange(W)[None,:]%donor.shape[1]]
clean=Image.composite(Image.fromarray(tile),old,remove);allpaint=Image.new('L',old.size,0);spec=json.loads((P/'stencils.json').read_text())
for name,s in spec.items():
 x,y,sw,sh=s['referenceRect'];source=Image.open(P/f'{name}-original-stencil.png').convert('L');smooth=clean_outline(source,round_corners=name=='upper')
 if name=='lower':
  smooth=Image.new('L',(sw*8,sh*8),0);dr=ImageDraw.Draw(smooth);dr.polygon([((px-x)*8,(py-y)*8) for px,py in [(1156.5,924.5),(1164,916.5),(1187.5,916.5),(1187.5,934.5),(1177.5,940),(1177.5,924.5)]],fill=255)
 target=smooth.resize((m.px(x+sw)-m.px(x),m.py(y+sh)-m.py(y)),Image.Resampling.LANCZOS);allpaint.paste(target,(m.px(x)-m.px(x0),m.py(y)-m.py(y0)))
paint=Image.new('RGBA',old.size,(243,244,247,255));new=Image.composite(paint,clean,allpaint);new.putalpha(old.getchannel('A'));b=np.array(new);changed=np.any(a!=b,2);mask=(np.array(remove)>0)|(np.array(allpaint)>0);assert np.array_equal(a[~mask],b[~mask]);green=(rgb[:,:,1]>rgb[:,:,0]*1.12)&(rgb[:,:,1]>rgb[:,:,2]*1.5)&(rgb[:,:,1]>100);assert np.array_equal(a[green],b[green]);assert np.array_equal(a[:,:,3],b[:,:,3])
old.save(P/'markings-before.png');new.save(P/'markings-fixed.png');remove.save(P/'old-paint-selection.png');allpaint.save(P/'restored-paint-mask.png')
canvas=Image.new('RGBA',(W*2,H));canvas.paste(old,(0,0));canvas.paste(new,(W,0));canvas.resize((1120,800),Image.Resampling.LANCZOS).save(P/'markings-before-after.png')
(P/'repair.json').write_text(json.dumps({'rect':rect,'pixelDensity':m.DENSITY,'sourceFragments':used,'originalReference':'public/modern/assets/map.png','originalPaintStencils':'stencils.json','oldPaintComponents':selected,'changedPixels':int(changed.sum()),'outsidePaintRepairUnchanged':True,'greenForegroundUnchanged':True,'alphaUnchanged':True,'method':'Trace and smooth original white paint silhouettes; restore native asphalt under misplaced generated marks; paint only the original silhouettes with matching existing white paint color.','userAuthorizedProgrammaticCorrection':True},indent=2))
