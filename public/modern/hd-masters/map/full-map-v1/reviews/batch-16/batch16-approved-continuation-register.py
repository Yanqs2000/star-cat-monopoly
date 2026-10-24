import sys,json,shutil,importlib.util
from pathlib import Path
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit,native_overlap_cut
rid='approved-east-native-continuation-r1';rect=[1152,420,176,312];ref=[1120,420,208,312]
p=m.WORK/'repairs'/rid;p.mkdir(exist_ok=True);cache=m.CACHE/rid;cache.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('q',m.CACHE/'batch16-quilt.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
before=q.quilt(ref);before.save(cache/'before-full.png')
old=before.crop((m.px(1152)-m.px(1120),0,before.width,before.height));old.save(cache/'before.png')
shutil.copy2(m.CACHE/'approved-east-boundary-reference/layout.png',cache/'layout.png')
g={'path':'/Users/yanqs/.codex/generated_images/01a14de9-d7ab-71d3-b7a1-3c4ebc1459a8/exec-d17349da-07ed-4bb2-a9f7-7f52619dc789.png','prompt':"Edit Image1: remove WRONG added blue background and extra white clouds from central SKY GAP between cliff and lower grassy island. Image2 is prior exact same frame showing correct TRANSPARENT gap; restore that original exterior transparency and original cloud count. There should be NO CLOUD across middle gap below road; retain only the original little cloud fragment cropped at farRIGHT near60%down as shown Image2. All newly added white puff clouds across middle/lower gap and all BLUE sky paint disappear to perfectly clear alpha0. Preserve Image1 repaired continuous GREEN30 DISC and LEAF ROSETTE shading, road/curb, grass/cliff faces, existing building/pillar crops and every solid object position exactly. No shape/count changes, only remove erroneous invented background/clouds. LEFT15.4% accepted art stays in place and unchanged; full frame/camera/crop portrait2:3 no rescaling. Solid foliage/numerals/plants/road/cloud-fragment interiors opaque, narrow natural antialias outside only, no glow. Keep repaired join and all outer edges stationary.",'referenceRect':ref,'rect':rect}
(cache/'generation.json').write_text(json.dumps(g,ensure_ascii=False,indent=2))
for name in ['before.png','layout.png','before-full.png']:shutil.copy2(cache/name,p/name)
shutil.copy2(g['path'],p/'master.png');native=Image.open(p/'master.png').convert('RGBA');native_alpha_audit(native);assert min(native.width/208,native.height/312)>=4
canonical=native.resize(before.size,Image.Resampling.LANCZOS);box=[m.px(1152)-m.px(1120),0,before.width,before.height];new=canonical.crop(box);a=np.array(old);b=np.array(new);n=round(16*m.DENSITY)
# Left boundary is a protected sample: compare its full32-pixel context, never modify it.
left_old=np.array(before)[:,:box[0]];left_new=np.array(canonical)[:,:box[0]]
_,_,st=native_overlap_cut(Image.fromarray(left_old),Image.fromarray(left_new),transition=left_old.shape[1],visibility=np.maximum(left_old[:,:,3],left_new[:,:,3])/255)
stats=[{'side':'left','protectedReferenceOnly':True,'approvedPixelsModified':False,**st}];keep=np.ones(a.shape[:2],bool)
for side in ['right','top','bottom']:
 if side=='right':oa,nb=a[:,-n:][:,::-1],b[:,-n:][:,::-1]
 elif side=='top':oa,nb=a[:n].transpose(1,0,2),b[:n].transpose(1,0,2)
 else:oa,nb=a[-n:][::-1].transpose(1,0,2),b[-n:][::-1].transpose(1,0,2)
 mask,path,st=native_overlap_cut(Image.fromarray(oa),Image.fromarray(nb),transition=n,visibility=np.maximum(oa[:,:,3],nb[:,:,3])/255)
 if side=='right':keep[:,-n:]&=mask[:,::-1]
 elif side=='top':keep[:n]&=mask.T
 else:keep[-n:]&=mask.T[::-1]
 stats.append({'side':side,**st})
(p/'seams.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))
assert all(v['meanRgbDifference']<=12 and v['p95RgbDifference']<=40 for v in stats)
mixed=np.where(keep[:,:,None],b,a);Image.fromarray(keep.astype('uint8')*255).save(p/'mask.png');Image.fromarray(mixed).save(p/'assembled.png');s=m.read();assert not any(r['id']==rid for r in s['repairs']);affected=[];x,y,w,h=rect
for t in s['tiles']:
 if not m.is_ready(t):continue
 ox,oy,ow,oh=t['rect'];ax,ay=max(x,ox),max(y,oy);bx,by=min(x+w,ox+ow),min(y+h,oy+oh)
 if ax>=bx or ay>=by:continue
 assert t['status']!='approved-source-reused';tp=m.WORK/'assembled'/f"{t['id']}.png";im=Image.open(tp).convert('RGBA');part=Image.fromarray(mixed).crop((m.px(ax)-m.px(x),m.py(ay)-m.py(y),m.px(bx)-m.px(x),m.py(by)-m.py(y)));im.paste(part,(m.px(ax)-m.px(ox),m.py(ay)-m.py(oy)));im.save(tp);t.setdefault('appliedRepairs',[]).append(rid);t['assembledSha256']=m.sha(tp);affected.append(t['id'])
files={name:{'path':str((p/name).relative_to(m.ROOT)),'sha256':m.sha(p/name)} for name in ['master.png','before.png','layout.png','mask.png','assembled.png']}
s['repairs'].append({'id':rid,'rect':rect,'referenceRect':ref,'canonicalNativeCrop':box,'generator':'built-in image_gen','prompt':g['prompt'],'nativePixelSize':list(native.size),'nativePixelDensity':min(native.width/208,native.height/312),'method':'Owned right-side native continuation; approved left32 context compared only; exact old/new native RGBA selection','files':files,'seams':stats,'affectedTiles':affected,'reviewStatus':'pending-actual-render-review','approvedSamplePixelsModified':False})
s['partialReviewRegions'].append({'repairId':rid,'rect':rect,'assembledPath':str((p/'assembled.png').relative_to(m.ROOT)),'requiredOverlay':True,'scope':'Only new right-hand map area; protected four samples unchanged'})
m.save(s);print('Applied',affected)
