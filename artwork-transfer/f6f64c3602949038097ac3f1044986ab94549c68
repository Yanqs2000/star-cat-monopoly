import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts')
import produce_hd_map as m
from hd_map_seams import native_overlap_cut as overlap_cut, native_alpha_audit

def apply(rid,rect,context):
    folder=m.WORK/'repairs'/rid;folder.mkdir(exist_ok=True)
    cache=m.CACHE/rid;g=json.load(open(cache/'generation.json'))
    shutil.copy2(g['path'],folder/'master.png');shutil.copy2(cache/'before.png',folder/'before.png');shutil.copy2(cache/'layout.png',folder/'layout.png')
    old=Image.open(folder/'before.png').convert('RGBA');native=Image.open(folder/'master.png').convert('RGBA')
    native_alpha_audit(native)
    assert min(native.width/rect[2],native.height/rect[3])>=4
    new=native.resize(old.size,Image.Resampling.LANCZOS);a=np.array(old);b=np.array(new);height,width=a.shape[:2];edge=round(context*m.DENSITY)
    keep=np.ones((height,width),bool);stats=[]
    for side in ['left','right','top','bottom']:
        if side=='left':oa,nb=a[:,:edge],b[:,:edge]
        elif side=='right':oa,nb=a[:,-edge:][:,::-1],b[:,-edge:][:,::-1]
        elif side=='top':oa,nb=a[:edge].transpose(1,0,2),b[:edge].transpose(1,0,2)
        else:oa,nb=a[-edge:][::-1].transpose(1,0,2),b[-edge:][::-1].transpose(1,0,2)
        mask,path,st=overlap_cut(Image.fromarray(oa),Image.fromarray(nb),transition=edge,visibility=np.maximum(oa[:,:,3],nb[:,:,3])/255)
        if side=='left':keep[:,:edge]&=mask
        elif side=='right':keep[:,-edge:]&=mask[:,::-1]
        elif side=='top':keep[:edge]&=mask.T
        else:keep[-edge:]&=mask.T[::-1]
        stats.append({'side':side,**st})
    print(rid,json.dumps(stats))
    assert all(st['meanRgbDifference']<=12 and st['p95RgbDifference']<=40 for st in stats)
    mixed=np.where(keep[:,:,None],b,a);Image.fromarray(keep.astype('uint8')*255).save(folder/'mask.png');Image.fromarray(mixed).save(folder/'assembled.png')
    s=m.read();assert not any(r['id']==rid for r in s['repairs']);x,y,w,h=rect;affected=[]
    for t in s['tiles']:
        if not (m.is_ready(t) or t['id'] in ['r3c9','r4c9']):continue
        ox,oy,ow,oh=t['rect'];left,top=max(x,ox),max(y,oy);right,bottom=min(x+w,ox+ow),min(y+h,oy+oh)
        if left>=right or top>=bottom:continue
        assert t['status']!='approved-source-reused','Protected pilot cannot be changed by local correction'
        p=m.WORK/'assembled'/f"{t['id']}.png";im=Image.open(p).convert('RGBA');part=Image.fromarray(mixed).crop((m.px(left)-m.px(x),m.py(top)-m.py(y),m.px(right)-m.px(x),m.py(bottom)-m.py(y)))
        im.paste(part,(m.px(left)-m.px(ox),m.py(top)-m.py(oy)));im.save(p);t.setdefault('appliedRepairs',[]).append(rid);t['assembledSha256']=m.sha(p);affected.append(t['id'])
    files={name:{'path':str((folder/name).relative_to(m.ROOT)),'sha256':m.sha(folder/name)} for name in ['master.png','before.png','layout.png','mask.png','assembled.png']}
    s['repairs'].append({'id':rid,'rect':rect,'generator':'built-in image_gen','prompt':g['prompt'],'nativePixelSize':list(native.size),'nativePixelDensity':min(native.width/w,native.height/h),'method':'Hard source pixel selection in local context; no painting, blending or alpha edits','files':files,'seams':stats,'affectedTiles':affected,'reviewStatus':'pending-actual-render-review'})
    s['partialReviewRegions'].append({'repairId':rid,'rect':rect,'assembledPath':str((folder/'assembled.png').relative_to(m.ROOT)),'requiredOverlay':True,'scope':'Local artifact correction; preserve in later exports'})
    m.save(s);print('Applied',affected)

rid=sys.argv[1];g=json.load(open(m.CACHE/rid/'generation.json'));apply(rid,g['rect'],g.get('context',16))
