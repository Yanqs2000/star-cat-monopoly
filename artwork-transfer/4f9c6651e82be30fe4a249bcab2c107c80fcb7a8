import sys,json,shutil,importlib.util
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
s=m.read();base=next(r for r in s['repairs'] if r['id']=='tomorrow-city-sign-r1');oldpartial=s['partialReviewRegions'][0];rect=oldpartial['rect'];x,y,w,h=rect
plan=json.load(open(m.CACHE/'batch14-sign-scope/plan.json'));windows=plan['exportRects'][:-1]+[[1180,1192,30,36],[1208,1204,18,34],[1224,1216,24,36],[1248,1232,28,40]]
plan['exportRects']=windows;plan['preserveCITYByIndividualCompleteLetterRectangles']=True;plan['method']='Exact rectangular native-pixel selection from existing accepted sign assembly; no new title generation, no background/alpha mask.'
(m.CACHE/'batch14-sign-scope/final-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
spec=importlib.util.spec_from_file_location('q','.analysis-cache/map-continuation-20261019/batch14-quilt.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q);before=q.quilt(rect);donor=Image.open(m.ROOT/oldpartial['assembledPath']).convert('RGBA');mask=np.zeros((before.height,before.width),bool)
for a,b,c,d in windows:mask[m.py(b)-m.py(y):m.py(b+d)-m.py(y),m.px(a)-m.px(x):m.px(a+c)-m.px(x)]=True
mixed=Image.fromarray(np.where(mask[:,:,None],np.array(donor),np.array(before)));rid='tomorrow-city-glyph-native-reuse-r1';folder=m.WORK/'repairs'/rid;assert not folder.exists();folder.mkdir();shutil.copy2(m.ROOT/base['files']['master.png']['path'],folder/'master.png');shutil.copy2(m.ROOT/oldpartial['assembledPath'],folder/'donor-canonical.png');before.save(folder/'before.png');Image.fromarray(mask.astype('uint8')*255).save(folder/'mask.png');mixed.save(folder/'assembled.png')
proof=Image.new('RGBA',donor.size)
for a,b,c,d in windows:
 box=(m.px(a)-m.px(x),m.py(b)-m.py(y),m.px(a+c)-m.px(x),m.py(b+d)-m.py(y));proof.paste(donor.crop(box),box[:2])
proof.save(m.CACHE/'batch14-sign-scope/rectangular-export-proof-final.png')
affected=[]
for t in s['tiles']:
 if not m.is_ready(t):continue
 ox,oy,ow,oh=t['rect'];p=m.WORK/'assembled'/f"{t['id']}.png";im=Image.open(p).convert('RGBA');changed=False
 for ax,ay,aw,ah in windows:
  a,b=max(ox,ax),max(oy,ay);c,d=min(ox+ow,ax+aw),min(oy+oh,ay+ah)
  if a<c and b<d:
   part=donor.crop((m.px(a)-m.px(x),m.py(b)-m.py(y),m.px(c)-m.px(x),m.py(d)-m.py(y)));im.paste(part,(m.px(a)-m.px(ox),m.py(b)-m.py(oy)));changed=True
 if changed:im.save(p);t.setdefault('appliedRepairs',[]).append(rid);t['assembledSha256']=m.sha(p);affected.append(t['id'])
files={p.name:{'path':str(p.relative_to(m.ROOT)),'sha256':m.sha(p)} for p in folder.iterdir() if p.is_file()}
s['repairs'].append({'id':rid,'rect':rect,'referenceRect':rect,'generator':'existing built-in image_gen native donor reuse; no new generation','nativePixelSize':list(Image.open(folder/'master.png').size),'nativePixelDensity':base['nativePixelDensity'],'method':plan['method'],'donorCanonicalFile':'donor-canonical.png','sourceRepair':'tomorrow-city-sign-r1','exportRects':windows,'files':files,'affectedTiles':affected,'seams':[],'reviewStatus':'pending-actual-render-review'})
s['partialReviewRegions'].append({'repairId':rid,'rect':rect,'assembledPath':str((folder/'assembled.png').relative_to(m.ROOT)),'requiredOverlay':True,'exportRects':windows,'scope':'Complete preserved TOMORROW and CITY native glyphs only; replay after later map repairs; no unrelated old background.'})
oldpartial['exportRects']=[];oldpartial['supersededBy']=rid
small=next(p for p in s['partialReviewRegions'] if p['repairId']=='central-long-dash-whole-r1');small['exportRects']=[];small['supersededBy']='central-long-lane-complete-r1'
next(r for r in s['repairs'] if r['id']=='central-long-dash-whole-r1')['reviewStatus']='superseded; first crop did not contain entire stripe, final whole-lane scene replaces it'
m.save(s);print(json.dumps({'reuse':rid,'affected':affected,'windows':windows}))
