import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_overlap_cut,native_alpha_audit
s=m.read();oldrepair=next(r for r in s['repairs'] if r['id']=='upper-cloud-middle-joint-r2');rx,ry,rw,rh=oldrepair['rect'];before=Image.open(m.ROOT/oldrepair['files']['before.png']['path']).convert('RGBA')
for t in s['tiles']:
 if t['id'] not in oldrepair['affectedTiles']:continue
 x,y,w,h=t['rect'];a,b=max(x,rx),max(y,ry);c,d=min(x+w,rx+rw),min(y+h,ry+rh)
 if a<c and b<d:
  p=m.WORK/'assembled'/f"{t['id']}.png";im=Image.open(p).convert('RGBA');im.paste(before.crop((m.px(a)-m.px(rx),m.py(b)-m.py(ry),m.px(c)-m.px(rx),m.py(d)-m.py(ry))),(m.px(a)-m.px(x),m.py(b)-m.py(y)));im.save(p);t['assembledSha256']=m.sha(p)
oldrepair.update(reviewStatus='withdrawn-visible-perimeter-color-step',exportRects=[],applied=False)
next(p for p in s['partialReviewRegions'] if p['repairId']==oldrepair['id'])['exportRects']=[]
m.save(s)
rid='upper-cloud-native-wide-overlap-r1';rect=[1840,180,72,176];folder=m.WORK/'repairs'/rid;folder.mkdir(exist_ok=True);x,y,w,h=rect
tiles={t['id']:t for t in s['tiles']}
def crop_native(tid):
 t=tiles[tid];rx,ry,rw,rh=t['referenceRect'];native=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA');native_alpha_audit(native)
 native=native.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
 return native.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)))
old=crop_native('r1c7');new=crop_native('r1c8');a=np.array(old);b=np.array(new);margin=round(16*m.DENSITY);inner_a=a[:,margin:-margin];inner_b=b[:,margin:-margin]
mask,path,st=native_overlap_cut(Image.fromarray(inner_a),Image.fromarray(inner_b),transition=inner_a.shape[1],visibility=np.maximum(inner_a[:,:,3],inner_b[:,:,3])/255)
print(json.dumps(st));assert st['meanRgbDifference']<=12 and st['p95RgbDifference']<=40
keep=np.zeros(a.shape[:2],bool);keep[:,margin:-margin]=mask;keep[:,-margin:]=True
mixed=np.where(keep[:,:,None],b,a);native_alpha_audit(Image.fromarray(mixed))
old.save(folder/'before.png');new.save(folder/'donor-canonical.png');Image.fromarray(keep.astype('uint8')*255).save(folder/'mask.png');Image.fromarray(mixed).save(folder/'assembled.png');shutil.copy2(m.ROOT/tiles['r1c8']['selectedMaster'],folder/'master.png')
source=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h));bg=Image.new('RGBA',source.size,(102,204,255,255));bg.alpha_composite(source);bg.resize(old.size).save(folder/'layout.png')
affected=[]
for t in s['tiles']:
 if t['id'] not in ['r1c7','r1c8']:continue
 ox,oy,ow,oh=t['rect'];left,top=max(x,ox),max(y,oy);right,bottom=min(x+w,ox+ow),min(y+h,oy+oh)
 p=m.WORK/'assembled'/f"{t['id']}.png";im=Image.open(p).convert('RGBA')
 # Both outer16-pixel logical strips already belong to these same two native sources.
 part=Image.fromarray(mixed).crop((m.px(left)-m.px(x),m.py(top)-m.py(y),m.px(right)-m.px(x),m.py(bottom)-m.py(y)));im.paste(part,(m.px(left)-m.px(ox),m.py(top)-m.py(oy)));im.save(p);t.setdefault('appliedRepairs',[]).append(rid);t['assembledSha256']=m.sha(p);affected.append(t['id'])
files={n:{'path':str((folder/n).relative_to(m.ROOT)),'sha256':m.sha(folder/n)} for n in ['master.png','before.png','donor-canonical.png','layout.png','mask.png','assembled.png']}
s['repairs'].append({'id':rid,'rect':rect,'generator':'built-in image_gen native reuse','nativePixelSize':list(Image.open(folder/'master.png').size),'nativePixelDensity':1254/312,'donorCanonicalFile':'donor-canonical.png','method':'72logical-pixel overlap of existing raw native masters; hard RGBA selection only;16logical-pixel end anchors unchanged','sourceNativeMasters':[{'path':tiles[k]['selectedMaster'],'sha256':m.sha(m.ROOT/tiles[k]['selectedMaster'])} for k in ['r1c7','r1c8']],'files':files,'seams':[{'side':'wide-overlap',**st}],'affectedTiles':affected,'reviewStatus':'pending-actual-render-review'})
s['partialReviewRegions'].append({'repairId':rid,'rect':rect,'assembledPath':str((folder/'assembled.png').relative_to(m.ROOT)),'requiredOverlay':True,'scope':'Wide source-native overlap, no generated replacement context or new image generation'})
m.save(s)
