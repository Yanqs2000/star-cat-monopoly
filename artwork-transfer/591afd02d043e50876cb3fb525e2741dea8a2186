import sys,json,hashlib
from pathlib import Path
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts')
import produce_hd_map as m
s=m.read();before=json.load(open(m.CACHE/'batch15-before/generation.json'))
prior={t['id']:t for t in before['tiles']}
out=m.WORK/'reviews/batch-15';out.mkdir(exist_ok=True)
ready=[t for t in s['tiles'] if m.is_ready(t)]
preview=[t for t in s['tiles'] if t['id'] in ['r3c9','r6c1','r4c9'] and t['status']=='pending-visual-review']
pieces=[]
for t in ready+preview:
    x,y,w,h=t['rect'];im=Image.open(m.WORK/'assembled'/f"{t['id']}.png").convert('RGBA')
    top=m.py(y)
    if t['id']=='r3c5':
        clip=m.py(692)-top;im=im.crop((0,clip,im.width,im.height));top+=clip
    pieces.append((m.px(x),top,im))
for p in s['partialReviewRegions']:
    x,y,w,h=p['rect'];partial=Image.open(m.ROOT/p['assembledPath']).convert('RGBA')
    for a,b,c,d in p.get('exportRects',[p['rect']]):
        pieces.append((m.px(a),m.py(b),partial.crop((m.px(a)-m.px(x),m.py(b)-m.py(y),m.px(a+c)-m.px(x),m.py(b+d)-m.py(y)))))
regions=[]
specs=[(t['id'],t['rect']) for t in ready if t['status']=='selected-engineering']
specs += [(t['id'],t['rect']) for t in preview]
specs += [('sign',s['partialReviewRegions'][0]['rect'])]
for label,rect in specs:
    x,y,w,h=rect
    if label=='r3c5':y=692;h=240;rect=[x,y,w,h]
    pilot_underlay=label in ['r2c2','r3c2']
    draw_width=w+32 if pilot_underlay else w
    left,top=m.px(x),m.py(y);right,bottom=m.px(x+draw_width),m.py(y+h)
    canvas=Image.new('RGBA',(right-left,bottom-top))
    for ox,oy,im in pieces:
        a,b=max(left,ox),max(top,oy);c,d=min(right,ox+im.width),min(bottom,oy+im.height)
        if a<c and b<d:canvas.paste(im.crop((a-ox,b-oy,c-ox,d-oy)),(a-left,b-top))
    if pilot_underlay:
        tile=next(t for t in s['tiles'] if t['id']==label);rx,ry,rw,rh=tile['referenceRect']
        raw=Image.open(m.ROOT/tile['selectedMaster']).convert('RGBA');canonical=raw.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
        part=canonical.crop((m.px(x+w)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w+32)-m.px(rx),m.py(y+h)-m.py(ry)))
        canvas.paste(part,(m.px(x+w)-left,0))
    path=out/f'{label}.webp';canvas.save(path,lossless=True,exact=True,method=6)
    assert np.array_equal(np.array(canvas),np.array(Image.open(path).convert('RGBA')))
    lx,ly=640+left/m.DENSITY,420+top/m.DENSITY
    regions.append({'label':label,'url':str(path.relative_to(m.ROOT/'public/modern')),'logicalRect':[lx,ly,canvas.width/m.DENSITY,canvas.height/m.DENSITY],'scenePosition':[lx-184,ly-313],'pixelDensity':m.DENSITY,'pixelSize':list(canvas.size),'sha256':m.sha(path),'coreRect':rect,'replacementRect':[x,y,draw_width,h],'protectedPilotUnderlay':pilot_underlay,'nativeAlpha':any(t['id']==label and t.get('workflow')=='native-rgba-coverage-preserved' for t in ready),'status':'needs-dice-icon-correction-preview-only' if label=='r4c9' else 'needs-curb-correction-preview-only' if label=='r3c9' else 'needs-west-road-correction-preview-only' if label=='r6c1' else 'review-only-not-production'})
for t in ready+preview:t['assembledSha256']=m.sha(m.WORK/'assembled'/f"{t['id']}.png")
m.save(s)
new=[t for t in ready if not m.is_ready(prior[t['id']])]
pending=[{'id':t['id'],'rect':t['rect'],'status':t['status'],'attemptCount':len(t['attempts']),'nextAction':'generate' if not t['attempts'] else 'rework'} for t in s['tiles'] if not m.is_ready(t)]
(out/'regions.json').write_text(json.dumps(regions,indent=2)+'\n')
(out/'new-candidates.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n')
(out/'pending-jobs.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'new':[t['id'] for t in new],'reviewRegions':len(regions),'remainingNotGenerated':sum(t['status']=='pending' and not t['attempts'] for t in s['tiles']),'remainingRework':sum(t['status']=='pending' and bool(t['attempts']) for t in s['tiles']),**m.summary(s)}))
