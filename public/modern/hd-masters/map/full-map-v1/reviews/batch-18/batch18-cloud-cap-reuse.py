import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();donor=next(t for t in s['tiles'] if t['id']=='r1c2');assert m.is_ready(donor)
rx,ry,rw,rh=ref=donor['referenceRect'];native=Image.open(m.ROOT/donor['selectedMaster']).convert('RGBA');native_audit=native_alpha_audit(native)
canonical=native.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
original=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA')
def crop(rect):
 x,y,w,h=rect;return canonical.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)))
for tid in ['r0c3','r0c2']:
 t=next(t for t in s['tiles'] if t['id']==tid);assert t['status']=='pending' and not t['attempts'];x,y,w,h=t['rect'];source=original.crop((x,y,x+w,y+h));a=np.array(source)[:,:,3]
 yy,xx=np.indices(a.shape);covered=(xx+x>=rx)&(xx+x<rx+rw)&(yy+y>=ry)&(yy+y<ry+rh);assert not a[~covered].any()
 core=crop(t['rect']);audit=native_alpha_audit(core,permitted_reference=source);proofs=[]
 if tid=='r0c3':
  # Its right neighbor is beyond the donor frame, but the complete shared
  #32px band on both sides is genuinely empty sky in original and native art.
  for other,rect in [('r0c3',[864,0,32,180]),('r0c4',[896,0,32,180])]:
   q=next(z for z in s['tiles'] if z['id']==other);ox,oy,ow,oh=q['rect'];ax,ay,aw,ah=rect
   assert not np.array(original.crop((ax,ay,ax+aw,ay+ah)))[:,:,3].any()
   im=core if other==tid else Image.open(m.WORK/'assembled'/f'{other}.png').convert('RGBA')
   part=im.crop((m.px(ax)-m.px(ox),m.py(ay)-m.py(oy),m.px(ax+aw)-m.px(ox),m.py(ay+ah)-m.py(oy)))
   alpha=np.array(part)[:,:,3];assert alpha.max()<=1
   proofs.append({'neighbor':other,'rect':rect,'originalAlphaExactlyZero':True,'nativeMaximumAlpha':int(alpha.max()),'nativeNonzeroAlphaPixels':int((alpha>0).sum()),'nativeAlphaUnmodified':True})
 else:
  for other,rect in [('r0c3',[640,0,32,180]),('r1c2',[400,180,240,32])]:
   q=next(z for z in s['tiles'] if z['id']==other);ox,oy,ow,oh=q['rect'];ax,ay,aw,ah=rect
   im=Image.open(m.WORK/'assembled'/f'{other}.png').convert('RGBA');part=im.crop((m.px(ax)-m.px(ox),m.py(ay)-m.py(oy),m.px(ax+aw)-m.px(ox),m.py(ay+ah)-m.py(oy)))
   assert np.array_equal(np.array(crop(rect)),np.array(part));proofs.append({'neighbor':other,'rect':rect,'exactNativeRgbaContextMatch':True})
 master=m.WORK/'masters'/f'{tid}-r1-native-reused.png';shutil.copy2(m.ROOT/donor['selectedMaster'],master);out=m.WORK/'assembled'/f'{tid}.png';core.save(out)
 attempt={'masterPath':str(master.relative_to(m.ROOT)),'masterSha256':m.sha(master),'nativePixelSize':list(native.size),'referenceRect':ref,'generator':'built-in image_gen native context reuse','workflow':'native-rgba-coverage-preserved','sourceMaskApplied':False,'sourceNativeMaster':donor['selectedMaster'],'sourceNativeSha256':m.sha(m.ROOT/donor['selectedMaster']),'nativeAlphaAuditBeforePadding':native_audit,'alphaAudit':audit,'transparentCanvasPadding':{'sourceNonzeroAlphaOutsideGeneratedReference':0,'logicalPixelsPadded':int((~covered).sum()),'nativeAlphaModified':False},'neighborContextProofs':proofs,'prompt':'Reuse validated r1c2 native cloud crown; transparent padding only where original map is exactly transparent. Preserve a single continuous cloud across all three cells.'}
 t['attempts'].append(attempt);t.update(status='selected-engineering',selectedMaster=attempt['masterPath'],referenceRect=ref,nativePixelDensity=min(native.width/rw,native.height/rh),workflow='native-rgba-coverage-preserved',sourceSkyReference=True,sourceMaskApplied=False,alphaAudit=audit,assembledSha256=m.sha(out),reviewStatus='pending-native-cloud-cap-render-review');m.save(s);print(json.dumps({'id':tid,'sourceNonzeroAlphaPixels':int((a>0).sum()),'sourceOpaquePixels':int((a==255).sum()),'nativeContextUnchanged':True,'proofs':proofs,**m.summary(s)}))
