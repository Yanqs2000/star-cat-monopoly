import sys,json
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_overlap_cut,native_alpha_audit
folder=m.CACHE/sys.argv[1];g=json.load(open(folder/'generation.json'));old=Image.open(folder/'before.png').convert('RGBA');raw=Image.open(g['path']).convert('RGBA');assert min(raw.width/g['rect'][2],raw.height/g['rect'][3])>=4;alpha=native_alpha_audit(raw);new=raw.resize(old.size,Image.Resampling.LANCZOS);a=np.array(old);b=np.array(new);height,width=a.shape[:2];edge=round(g['context']*m.DENSITY);keep=np.ones((height,width),bool);stats=[]
for side in ['left','right','top','bottom']:
 if side=='left':oa,nb=a[:,:edge],b[:,:edge]
 elif side=='right':oa,nb=a[:,-edge:][:,::-1],b[:,-edge:][:,::-1]
 elif side=='top':oa,nb=a[:edge].transpose(1,0,2),b[:edge].transpose(1,0,2)
 else:oa,nb=a[-edge:][::-1].transpose(1,0,2),b[-edge:][::-1].transpose(1,0,2)
 mask,path,st=native_overlap_cut(Image.fromarray(oa),Image.fromarray(nb),transition=edge,visibility=np.maximum(oa[:,:,3],nb[:,:,3])/255)
 if side=='left':keep[:,:edge]&=mask
 elif side=='right':keep[:,-edge:]&=mask[:,::-1]
 elif side=='top':keep[:edge]&=mask.T
 else:keep[-edge:]&=mask.T[::-1]
 stats.append({'side':side,**st})
Image.fromarray(np.where(keep[:,:,None],b,a)).save(folder/'assembled-candidate.png');Image.fromarray(keep.astype('uint8')*255).save(folder/'mask.png');result={'seams':stats,'alpha':alpha,'passed':all(st['meanRgbDifference']<=12 and st['p95RgbDifference']<=40 for st in stats),'nativePixelSize':list(raw.size)};(folder/'evaluation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
