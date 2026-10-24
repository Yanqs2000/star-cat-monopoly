import sys,json,shutil
from pathlib import Path
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit,native_overlap_cut
tile_id,file=sys.argv[1:];s=m.read();t=next(t for t in s['tiles'] if t['id']==tile_id);assert t['status'] in ['pending','pending-visual-review'];g=json.load(open(file));rx,ry,rw,rh=g['referenceRect'];native=Image.open(g['path']).convert('RGBA')
master=m.WORK/'masters'/f"{tile_id}-r{len(t['attempts'])+1}.png";shutil.copy2(g['path'],master)
a={'masterPath':str(master.relative_to(m.ROOT)),'masterSha256':m.sha(master),'nativePixelSize':list(native.size),'referenceRect':g['referenceRect'],'prompt':g['prompt'],'generator':'built-in image_gen','workflow':'native-rgba-coverage-preserved','sourceMaskApplied':False,'verifiedNeighborSubregions':g.get('verifiedNeighborSubregions',[])};t['attempts'].append(a)
def reject(reason):
 a['rejected']=reason;m.save(s);print(json.dumps({'id':tile_id,'accepted':False,**a},ensure_ascii=False));sys.exit(0)
def apply_shared(image,world_x,world_y):
 for repair in g.get('sharedRepairs',[]):
  sx_,sy_,sw_,sh_=repair['rect'];a,b=max(world_x,sx_),max(world_y,sy_);c,d=min(world_x+image.width/m.DENSITY,sx_+sw_),min(world_y+image.height/m.DENSITY,sy_+sh_)
  # All geometric intersections use integer logical bounds supplied by callers.
  a,b,c,d=map(round,(a,b,c,d))
  if a<c and b<d:
   patch=Image.open(m.ROOT/repair['assembledPath']).convert('RGBA')
   part=patch.crop((m.px(a)-m.px(sx_),m.py(b)-m.py(sy_),m.px(c)-m.px(sx_),m.py(d)-m.py(sy_)))
   image.paste(part,(m.px(a)-m.px(world_x),m.py(b)-m.py(world_y)))
 return image

sx,sy=native.width/rw,native.height/rh
if min(sx,sy)<4 or abs(sx/sy-1)>.01:reject('Native density/aspect mismatch')
reference_alpha=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((rx,ry,rx+rw,ry+rh)) if g.get('sourceSkyReference') else None
try:a['alphaAudit']=native_alpha_audit(native,permitted_reference=reference_alpha)
except ValueError as error:reject(str(error))
image=apply_shared(native.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS),rx,ry);x,y,w,h=t['rect'];cx,cy=m.px(x)-m.px(rx),m.py(y)-m.py(ry);cw,ch=m.px(x+w)-m.px(x),m.py(y+h)-m.py(y);core=image.crop((cx,cy,cx+cw,cy+ch));staged=[];stats=[]
if rx>x or ry>y or rx+rw<x+w or ry+rh<y+h:
 assert g.get('verifiedTransparentPadding')
 source=np.array(Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h)))[:,:,3]
 yy,xx=np.indices(source.shape);covered=(xx+x>=rx)&(xx+x<rx+rw)&(yy+y>=ry)&(yy+y<ry+rh)
 assert not source[~covered].any(),'Visible original art cannot be replaced by transparent padding'
 a['transparentCanvasPadding']={'sourceNonzeroAlphaOutsideGeneratedReference':0,'logicalPixelsPadded':int((~covered).sum()),'nativeAlphaModified':False}
for side,dr,dc in [('left',0,-1),('right',0,1),('top',-1,0),('bottom',1,0)]:
 old=next((v for v in s['tiles'] if v['row']==t['row']+dr and v['col']==t['col']+dc),None)
 refs=[r for r in g.get('verifiedNeighborSubregions',[]) if r['tileId']==(old or {}).get('id') and r['side']==side]
 if old is None or not (m.is_ready(old) or refs):continue
 ox,oy,ow,oh=old['rect'];coverage=g.get('neighborCoverageRects',{}).get(old['id'],old['rect']);p=m.WORK/'assembled'/f"{old['id']}.png";previous=apply_shared(Image.open(p).convert('RGBA'),ox,oy);old_array=np.array(previous)
 if side=='left':
  top,bottom=max(y,ry,coverage[1]),min(y+h,ry+rh,coverage[1]+coverage[3]);n=min(32,x-rx);overlap=m.px(x)-m.px(x-n);box=(cx-overlap,m.py(top)-m.py(ry),cx,m.py(bottom)-m.py(ry));area=(previous.width-overlap,m.py(top)-m.py(oy),previous.width,m.py(bottom)-m.py(oy));world=[x-n,top,n,bottom-top]
 elif side=='right':
  top,bottom=max(y,ry,coverage[1]),min(y+h,ry+rh,coverage[1]+coverage[3]);n=min(32,rx+rw-x-w);overlap=m.px(x+w+n)-m.px(x+w);box=(cx+cw,m.py(top)-m.py(ry),cx+cw+overlap,m.py(bottom)-m.py(ry));area=(0,m.py(top)-m.py(oy),overlap,m.py(bottom)-m.py(oy));world=[x+w,top,n,bottom-top]
 elif side=='top':
  left,right=max(x,rx),min(x+w,rx+rw);n=min(32,y-ry);overlap=m.py(y)-m.py(y-n);box=(m.px(left)-m.px(rx),cy-overlap,m.px(right)-m.px(rx),cy);area=(m.px(left)-m.px(ox),previous.height-overlap,m.px(right)-m.px(ox),previous.height);world=[left,y-n,right-left,n]
 else:
  left,right=max(x,rx),min(x+w,rx+rw);n=min(32,ry+rh-y-h);overlap=m.py(y+h+n)-m.py(y+h);box=(m.px(left)-m.px(rx),cy+ch,m.px(right)-m.px(rx),cy+ch+overlap);area=(m.px(left)-m.px(ox),0,m.px(right)-m.px(ox),overlap);world=[left,y+h,right-left,n]
 assert n>0 and min(box)>=0 and box[2]<=image.width and box[3]<=image.height
 if refs:
  wx,wy,ww,wh=world;assert any(r['rect'][0]<=wx and r['rect'][1]<=wy and wx+ww<=r['rect'][0]+r['rect'][2] and wy+wh<=r['rect'][1]+r['rect'][3] for r in refs)
 op=np.array(previous.crop(area));np_=np.array(image.crop(box))
 if side=='right':op=op[:,::-1];np_=np_[:,::-1]
 elif side=='top':op=op.transpose(1,0,2);np_=np_.transpose(1,0,2)
 elif side=='bottom':op=op[::-1].transpose(1,0,2);np_=np_[::-1].transpose(1,0,2)
 if old['status']=='approved-source-reused':
  assert g.get('preserveApprovedNeighbors'), 'Protected pilot requires explicit non-mutating comparison mode'
  wx,wy,ww,wh=world
  source_alpha=np.array(Image.open(m.ROOT/'public/modern/assets/map.png').crop((wx,wy,wx+ww,wy+wh)).getchannel('A').resize(previous.crop(area).size,Image.Resampling.NEAREST))
  if side=='right':source_alpha=source_alpha[:,::-1]
  elif side=='top':source_alpha=source_alpha.T
  elif side=='bottom':source_alpha=source_alpha[::-1].T
  analysis_old=op.copy();analysis_old[:,:,3]=source_alpha
  _,_,st=native_overlap_cut(Image.fromarray(analysis_old),Image.fromarray(np_),transition=overlap,visibility=np.maximum(source_alpha,np_[:,:,3])/255)
  stats.append({'side':side,**st,'protectedNeighbor':old['id'],'approvedAssemblyModified':False,'sourceAlphaForAnalysisOnly':True,'sharedContext':n})
  a.setdefault('preservedApprovedNeighbors',[]).append({'tileId':old['id'],'sha256':m.sha(p),'comparisonRect':world,'analysisOnlySourceAlpha':True,'outputMaskApplied':False})
  continue
 visibility=np.maximum(op[:,:,3],np_[:,:,3])/255
 mask,path,st=native_overlap_cut(Image.fromarray(op),Image.fromarray(np_),transition=min(overlap,round(16*m.DENSITY)),visibility=visibility);stats.append({'side':side,'comparisonRect':world,'neighborCoverageRect':coverage,**st});mixed=np.where(mask[:,:,None],np_,op)
 if side=='right':mixed=mixed[:,::-1]
 elif side=='top':mixed=mixed.transpose(1,0,2)
 elif side=='bottom':mixed=mixed.transpose(1,0,2)[::-1]
 old_array[area[1]:area[3],area[0]:area[2]]=mixed
 if old['status']=='approved-source-reused' and not np.array_equal(old_array,np.array(previous)):reject('Protected approved reference would change')
 staged.append((p,Image.fromarray(old_array)))
a['seams']=stats
if any(v['meanRgbDifference']>12 or v['p95RgbDifference']>40 for v in stats):reject('Overlap disagreement too large')
core_reference=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h)) if g.get('sourceSkyReference') else None
final_audit=native_alpha_audit(core,permitted_reference=core_reference)
a['neighborCoverageRects']=g.get('neighborCoverageRects',{});a['unusedContextCaution']=g.get('unusedContextCaution');a['sourceSkyReference']=g.get('sourceSkyReference',False)
a['sharedRepairs']=g.get('sharedRepairs',[]);a['nativeAlphaAuditBeforeRepairs']=a['alphaAudit'];a['alphaAudit']=final_audit
core.save(m.WORK/'assembled'/f'{tile_id}.png')
for p,modified in staged:modified.save(p)
t.update(status='selected-engineering',selectedMaster=a['masterPath'],referenceRect=g['referenceRect'],nativePixelDensity=min(sx,sy),seams=stats,workflow=a['workflow'],sharedRepairs=a['sharedRepairs'],sourceSkyReference=a['sourceSkyReference'],sourceMaskApplied=False,alphaAudit=a['alphaAudit'],reviewStatus='pending-native-alpha-render-review');m.save(s)
print(json.dumps({'id':tile_id,'accepted':True,'alphaAudit':a['alphaAudit'],'seams':stats,**m.summary(s)},ensure_ascii=False))
