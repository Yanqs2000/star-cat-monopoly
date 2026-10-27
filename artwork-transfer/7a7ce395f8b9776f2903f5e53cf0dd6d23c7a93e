import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();t=next(t for t in s['tiles'] if t['id']=='r0c9');donor=next(t for t in s['tiles'] if t['id']=='r1c9');assert t['status']=='pending' and not t['attempts']
ref=donor['referenceRect'];rx,ry,rw,rh=ref;x,y,w,h=t['rect'];source=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h));a=np.array(source)[:,:,3]
yy,xx=np.indices(a.shape);covered=(xx+x>=rx)&(xx+x<rx+rw)&(yy+y>=ry)&(yy+y<ry+rh)
assert not a[~covered].any() and int(a.max())==82 and not (a>=200).any()
native=Image.open(m.ROOT/donor['selectedMaster']).convert('RGBA');native_audit=native_alpha_audit(native)
canonical=native.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS);core=canonical.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)));b=np.array(core)[:,:,3];assert b.max()<=1
p=m.WORK/'masters/r0c9-r1-native-reused.png';shutil.copy2(m.ROOT/donor['selectedMaster'],p);out=m.WORK/'assembled/r0c9.png';core.save(out)
audit={'enclosedLowAlphaPixels':0,'referenceApprovedSkyPixels':0,'referenceRegistrationOutlierPixels':0,'borderConnectedLowAlphaPixels':int(b.size),'solidAlphaMedian':None,'fullyOpaqueFraction':0.0,'nativeAlphaModified':False,'sourceHasNoSolidArtwork':True,'sourceMaxAlpha':int(a.max()),'sourceNonzeroAlphaPixels':int((a>0).sum()),'nativeCoreMaxAlpha':int(b.max())}
attempt={'masterPath':str(p.relative_to(m.ROOT)),'masterSha256':m.sha(p),'nativePixelSize':list(native.size),'referenceRect':ref,'generator':'built-in image_gen native context reuse','workflow':'native-rgba-coverage-preserved','sourceMaskApplied':False,'sourceNativeMaster':donor['selectedMaster'],'sourceNativeSha256':m.sha(m.ROOT/donor['selectedMaster']),'nativeAlphaAuditBeforePadding':native_audit,'alphaAudit':audit,'transparentCanvasPadding':{'sourceNonzeroAlphaOutsideGeneratedReference':0,'logicalPixelsPadded':int((~covered).sum()),'nativeAlphaModified':False},'prompt':'Reuse validated r1c9 native top context for this sky-edge-only cell; transparent padding only where the original map is exactly transparent.'}
t['attempts'].append(attempt);t.update(status='selected-engineering',selectedMaster=attempt['masterPath'],referenceRect=ref,nativePixelDensity=min(native.width/rw,native.height/rh),workflow='native-rgba-coverage-preserved',sourceSkyReference=True,sourceMaskApplied=False,transparentContextOnly=True,alphaAudit=audit,assembledSha256=m.sha(out),reviewStatus='pending-sky-edge-context-render-review');m.save(s);print(json.dumps({'id':t['id'],'sourcePixels':int((a>0).sum()),'sourceOpaquePixels':0,'nativeContextUnchanged':True,**m.summary(s)}))
