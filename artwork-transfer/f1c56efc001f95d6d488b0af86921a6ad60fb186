import sys,json
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
s=m.read();r=next(r for r in s['repairs'] if r['id']=='tomorrow-city-glyph-native-reuse-r1');f=m.WORK/'repairs'/r['id'];x,y,w,h=r['rect'];source=m.WORK/'reviews/batch-13/sign.webp';donor=Image.open(source).convert('RGBA');donor.save(f/'donor-canonical-v2.png');mask=np.array(Image.open(f/'mask.png'))>0;before=Image.open(f/'before.png').convert('RGBA');Image.fromarray(np.where(mask[:,:,None],np.array(donor),np.array(before))).save(f/'assembled-v2.png');assert np.array_equal(np.array(Image.open(f/'donor-canonical-v2.png').convert('RGBA')),np.array(donor))
r['previousAssembly']={'files':{k:v for k,v in r['files'].items() if k in ['donor-canonical.png','assembled.png']},'reason':'The first title donor preceded the accepted curb repair. Use exact final batch13 quilt, which already contains that repair, to prevent reintroducing the old notch.'}
r['files']['donor-canonical.png']={'path':str((f/'donor-canonical-v2.png').relative_to(m.ROOT)),'sha256':m.sha(f/'donor-canonical-v2.png')};r['files']['assembled.png']={'path':str((f/'assembled-v2.png').relative_to(m.ROOT)),'sha256':m.sha(f/'assembled-v2.png')};r['donorCanonicalFile']='donor-canonical-v2.png';r['sourcePreview']={'path':str(source.relative_to(m.ROOT)),'sha256':m.sha(source),'containsPreviousCurbRepair':True};r['method']='Exact rectangular reuse of accepted batch13 native sign quilt AFTER tomorrow-city-curb-r1; no new generation, paint or alpha edits.'
p=next(p for p in s['partialReviewRegions'] if p['repairId']==r['id']);p['assembledPath']=str((f/'assembled-v2.png').relative_to(m.ROOT));p['scope']='Exact accepted native title and prior straight-curb repair; never replay older pre-curb context.'
for t in s['tiles']:
 if not m.is_ready(t):continue
 ox,oy,ow,oh=t['rect'];path=m.WORK/'assembled'/f"{t['id']}.png";im=Image.open(path).convert('RGBA');changed=False
 for ax,ay,aw,ah in r['exportRects']:
  a,b=max(ox,ax),max(oy,ay);c,d=min(ox+ow,ax+aw),min(oy+oh,ay+ah)
  if a<c and b<d:im.paste(donor.crop((m.px(a)-m.px(x),m.py(b)-m.py(y),m.px(c)-m.px(x),m.py(d)-m.py(y))),(m.px(a)-m.px(ox),m.py(b)-m.py(oy)));changed=True
 if changed:im.save(path);t['assembledSha256']=m.sha(path)
m.save(s)
q=m.CACHE/'batch14-sign-scope/final-plan.json';g=json.load(open(q));g['acceptedFinalDonor']=r['sourcePreview'];g['method']=r['method'];q.write_text(json.dumps(g,indent=2)+'\n')
