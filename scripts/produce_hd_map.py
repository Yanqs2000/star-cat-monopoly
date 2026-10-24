"""Prepare native ImageGen references and assemble inspected map tiles; no API generation."""
from __future__ import annotations
import argparse, hashlib, json, shutil
from pathlib import Path
import numpy as np
from PIL import Image
from build_hd_map_region_sample import _stitch_overlapping_tiles
from hd_map_seams import overlap_cut

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'public/modern/hd-masters/map/full-map-v1'
CACHE = ROOT / '.analysis-cache/map-continuation-20261019'
STATE = WORK / 'generation.json'
DENSITY = 4.3515625
X = [0,160,400,640,896,1152,1392,1632,1872,2112,2352,2592,2700]
Y = [0,180,420,676,932,1172,1412,1652,1892,2132,2372,2552]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
px = lambda x: round((x-640)*DENSITY)
py = lambda y: round((y-420)*DENSITY)

def read():
    return json.loads(STATE.read_text())

def save(state):
    STATE.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')

def is_ready(tile):
    return tile['status'] in ('approved-source-reused', 'selected-engineering')

def initialise():
    if STATE.exists():
        raise ValueError('Existing generation state must be resumed, never reset')
    WORK.mkdir(parents=True); (WORK/'assembled').mkdir();(WORK/'masters').mkdir()
    manifest=json.loads((ROOT/'public/modern/hd-masters/map/region-11-9-v2/masters.json').read_text())
    tiles={}
    for t in manifest['tiles']:
        p=ROOT/t['sourcePath']
        if sha(p)!=t['sourceSha256']:raise ValueError('Approved native master changed')
        image=Image.open(p).convert('RGBA')
        if image.getchannel('A').getextrema()!=(255,255):raise ValueError('Native donor must be opaque')
        tiles[t['tile']]=image
    donor=_stitch_overlapping_tiles(tiles,DENSITY,16)
    source=Image.open(ROOT/'public/modern/assets/map.png').convert('RGBA')
    state={'version':1,'sourceMapSha256':sha(ROOT/'public/modern/assets/map.png'),
           'pixelDensity':DENSITY,'minimumNativeDensity':4,'context':32,'transition':16,
           'approvedRect':[640,420,512,512],'tiles':[]}
    for r,(y,y1) in enumerate(zip(Y,Y[1:])):
        for c,(x,x1) in enumerate(zip(X,X[1:])):
            alpha=np.asarray(source.crop((x,y,x1,y1)))[:,:,3]
            if not alpha.any():continue
            t={'id':f'r{r}c{c}','row':r,'col':c,'rect':[x,y,x1-x,y1-y],
               'status':'pending','opaqueFraction':float((alpha==255).mean()),'attempts':[]}
            if 640<=x and x1<=1152 and 420<=y and y1<=932:
                t['status']='approved-source-reused'
                donor.crop((px(x),py(y),px(x1),py(y1))).save(WORK/'assembled'/f"{t['id']}.png")
            state['tiles'].append(t)
    save(state)
    return summary(state)

def summary(state):
    from collections import Counter
    counts=Counter(t['status'] for t in state['tiles'])
    ready={ (t['row'],t['col']) for t in state['tiles'] if is_ready(t) }
    frontier=[]
    for t in state['tiles']:
        if t['status']!='pending':continue
        r,c=t['row'],t['col'];n=sum((rr,cc) in ready for rr,cc in [(r,c-1),(r,c+1),(r-1,c),(r+1,c)])
        frontier.append((n,t['opaqueFraction'],t['id']))
    return {'counts':dict(counts),'total':len(state['tiles']),
            'next':[v[2] for v in sorted(frontier,reverse=True)[:8]]}

def context_sizes(known):
    context = dict.fromkeys(['left', 'right', 'top', 'bottom'], 0)
    for index, side in enumerate(known):
        context[side] = (128 if len(known) == 1 else 56 if len(known) == 2
                         else 64 if index == 0 else 16)
    return context


def reference(tile_id):
    state=read();t=next(t for t in state['tiles'] if t['id']==tile_id)
    if t['status']!='pending':raise ValueError('Do not regenerate completed artwork')
    x,y,w,h=t['rect']
    with Image.open(ROOT/'public/modern/assets/map.png') as source:
        if source.convert('RGBA').crop((x,y,x+w,y+h)).getchannel('A').getextrema() != (255,255):
            raise ValueError('Map edge requires a native silhouette workflow; opaque inland generation cannot be clipped to the old outline')
    by_cell={(a['row'],a['col']):a for a in state['tiles']}
    sides=[('left',0,-1),('right',0,1),('top',-1,0),('bottom',1,0)]
    known=[(name,by_cell[(t['row']+dr,t['col']+dc)]) for name,dr,dc in sides
           if (t['row']+dr,t['col']+dc) in by_cell and is_ready(by_cell[(t['row']+dr,t['col']+dc)])]
    known.sort(key=lambda pair:pair[1]['status']!='approved-source-reused')
    context=context_sizes([side for side, old in known])
    rect=[x-context['left'],y-context['top'],w+context['left']+context['right'],h+context['top']+context['bottom']]
    width,height=rect[2]*4,rect[3]*4
    target=Image.new('RGBA',(width,height))
    for old in state['tiles']:
        if not is_ready(old):continue
        ox,oy,ow,oh=old['rect'];a,b=max(rect[0],ox),max(rect[1],oy);c,d=min(rect[0]+rect[2],ox+ow),min(rect[1]+rect[3],oy+oh)
        if a>=c or b>=d:continue
        with Image.open(WORK/'assembled'/f"{old['id']}.png") as image:
            part=image.crop((px(a)-px(ox),py(b)-py(oy),px(c)-px(ox),py(d)-py(oy)))
            part=part.resize(((c-a)*4,(d-b)*4),Image.Resampling.LANCZOS)
            target.paste(part,((a-rect[0])*4,(b-rect[1])*4))
    out=CACHE/'inputs'/tile_id;out.mkdir(parents=True,exist_ok=True)
    target.save(out/'target.png')
    with Image.open(ROOT/'public/modern/assets/map.png') as source:
        source.crop((rect[0],rect[1],rect[0]+rect[2],rect[1]+rect[3])).save(out/'layout.png')
    meta={'id':tile_id,'contentRect':t['rect'],'referenceRect':rect,'targetSize':[width,height],
          'target':str(out/'target.png'),'layout':str(out/'layout.png')}
    (out/'reference.json').write_text(json.dumps(meta,indent=2)+'\n')
    return meta

def accept(tile_id,generation):
    state=read();t=next(t for t in state['tiles'] if t['id']==tile_id)
    if t['status']!='pending':raise ValueError('Completed artwork must not be regenerated')
    g=json.loads(Path(generation).read_text());reference_rect=g.get('referenceRect')
    if reference_rect is None:reference_rect=json.loads((CACHE/'inputs'/tile_id/'reference.json').read_text())['referenceRect']
    p=Path(g['path']);native=Image.open(p).convert('RGBA');rx,ry,rw,rh=reference_rect
    master=WORK/'masters'/f"{tile_id}-r{len(t['attempts'])+1}.png";shutil.copy2(p,master)
    attempt={'masterPath':str(master.relative_to(ROOT)),'masterSha256':sha(master),'nativePixelSize':list(native.size),
             'referenceRect':reference_rect,'prompt':g['prompt'],'generator':'built-in image_gen'}
    t['attempts'].append(attempt)
    sx,sy=native.width/rw,native.height/rh
    reason=None
    if min(sx,sy)<4:reason='Native density below4'
    elif abs(sx/sy-1)>.01:reason='Native canvas aspect drift'
    elif native.getchannel('A').getextrema()!=(255,255):reason='Opaque generation required; source silhouette is applied only at render time'
    if reason:
        attempt['rejected']=reason;save(state);return {'id':tile_id,'accepted':False,'reason':reason}
    image=native.resize((px(rx+rw)-px(rx),py(ry+rh)-py(ry)),Image.Resampling.LANCZOS)
    x,y,w,h=t['rect'];cx,cy=px(x)-px(rx),py(y)-py(ry);cw,ch=px(x+w)-px(x),py(y+h)-py(y)
    core=image.crop((cx,cy,cx+cw,cy+ch));by_cell={(old['row'],old['col']):old for old in state['tiles']}
    staged=[];metrics=[]
    source=Image.open(ROOT/'public/modern/assets/map.png').convert('RGBA')
    for side,dr,dc in [('left',0,-1),('right',0,1),('top',-1,0),('bottom',1,0)]:
        old=by_cell.get((t['row']+dr,t['col']+dc))
        if old is None or not is_ready(old):continue
        ox,oy,ow,oh=old['rect'];old_image=Image.open(WORK/'assembled'/f"{old['id']}.png").convert('RGBA');old_array=np.array(old_image)
        if side=='left':
            n=min(32,x-rx);overlap=px(x)-px(x-n);box=(cx-overlap,cy,cx,cy+ch);area=(old_image.width-overlap,0,old_image.width,old_image.height);world=(x-n,y,x,y+h)
        elif side=='right':
            n=min(32,rx+rw-x-w);overlap=px(x+w+n)-px(x+w);box=(cx+cw,cy,cx+cw+overlap,cy+ch);area=(0,0,overlap,old_image.height);world=(x+w,y,x+w+n,y+h)
        elif side=='top':
            n=min(32,y-ry);overlap=py(y)-py(y-n);box=(cx,cy-overlap,cx+cw,cy);area=(0,old_image.height-overlap,old_image.width,old_image.height);world=(x,y-n,x+w,y)
        else:
            n=min(32,ry+rh-y-h);overlap=py(y+h+n)-py(y+h);box=(cx,cy+ch,cx+cw,cy+ch+overlap);area=(0,0,old_image.width,overlap);world=(x,y+h,x+w,y+h+n)
        if n<=0:raise ValueError(f'Missing generated context on {side}')
        if min(box)<0 or box[2]>image.width or box[3]>image.height:raise ValueError(f'Missing generated context on {side}')
        old_part=np.array(old_image.crop(area));new_part=np.array(image.crop(box))
        visibility=np.asarray(source.crop(world).getchannel('A').resize((old_part.shape[1],old_part.shape[0]),Image.Resampling.LANCZOS))/255
        if side=='right':old_part=old_part[:,::-1];new_part=new_part[:,::-1];visibility=visibility[:,::-1]
        elif side=='top':old_part=old_part.transpose(1,0,2);new_part=new_part.transpose(1,0,2);visibility=visibility.T
        elif side=='bottom':old_part=old_part[::-1].transpose(1,0,2);new_part=new_part[::-1].transpose(1,0,2);visibility=visibility[::-1].T
        mask,path,stats=overlap_cut(Image.fromarray(old_part),Image.fromarray(new_part),transition=min(overlap,round(16*DENSITY)),visibility=visibility)
        mixed=np.where(mask[:,:,None],new_part,old_part)
        if side=='right':mixed=mixed[:,::-1]
        elif side=='top':mixed=mixed.transpose(1,0,2)
        elif side=='bottom':mixed=mixed.transpose(1,0,2)[::-1]
        old_array[area[1]:area[3],area[0]:area[2]]=mixed
        metrics.append({'side':side,**stats});staged.append((WORK/'assembled'/f"{old['id']}.png",Image.fromarray(old_array)))
    if any(s['meanRgbDifference']>12 or s['p95RgbDifference']>40 for s in metrics):
        attempt.update(rejected='Overlap disagreement too large',seams=metrics);save(state);return {'id':tile_id,'accepted':False,'seams':metrics}
    core.save(WORK/'assembled'/f'{tile_id}.png')
    for dest,modified in staged:modified.save(dest)
    t.update(status='selected-engineering',selectedMaster=attempt['masterPath'],referenceRect=reference_rect,
             nativePixelDensity=min(sx,sy),seams=metrics,reviewStatus='pending-user-review')
    save(state)
    return {'id':tile_id,'accepted':True,'nativeDensity':min(sx,sy),'seams':metrics,**summary(state)}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['plan','reference','accept','report']);parser.add_argument('id',nargs='?');parser.add_argument('generation',nargs='?');args=parser.parse_args()
    result=initialise() if args.action=='plan' else reference(args.id) if args.action=='reference' else accept(args.id,args.generation) if args.action=='accept' else summary(read())
    print(json.dumps(result,ensure_ascii=False))
