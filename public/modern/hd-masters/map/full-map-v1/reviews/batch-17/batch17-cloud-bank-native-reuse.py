import json,sys
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_overlap_cut,native_alpha_audit
rid='northeast-cloud-bank-native-reuse-r1';p=m.CACHE/rid;p.mkdir(exist_ok=True);rect=[2080,404,312,56];rx,ry,rw,rh=[2080,148,312,312]
paths=['/Users/yanqs/.codex/generated_images/01a14de9-d7ab-71d3-b7a1-3c4ebc1459a8/exec-c2facf24-4dbd-4d47-a0ec-0fa692c159df.png','/Users/yanqs/.codex/generated_images/01a14de9-d7ab-71d3-b7a1-3c4ebc1459a8/exec-0dfb425c-4779-411d-ac29-8424c6fdf1cc.png']
full=[Image.open(k).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS) for k in paths]
box=(0,m.py(404)-m.py(148),full[0].width,full[0].height);old,new=[v.crop(box) for v in full];a,b=np.array(old),np.array(new);margin=round(16*m.DENSITY)
oa=a[margin:-margin].transpose(1,0,2);nb=b[margin:-margin].transpose(1,0,2);mask,path,st=native_overlap_cut(Image.fromarray(oa),Image.fromarray(nb),transition=oa.shape[1],visibility=np.maximum(oa[:,:,3],nb[:,:,3])/255)
print(json.dumps(st));keep=np.zeros(a.shape[:2],bool);keep[margin:-margin]=mask.T;keep[-margin:]=True;mixed=np.where(keep[:,:,None],b,a)
old.save(p/'before.png');new.save(p/'donor-canonical.png');Image.fromarray(keep.astype('uint8')*255).save(p/'mask.png');Image.fromarray(mixed).save(p/'assembled.png');full[0].paste(Image.fromarray(mixed),(0,box[1]));full[0].save(p/'proposed-full.png')
try:print('alpha',native_alpha_audit(full[0]))
except ValueError as e:print('ALPHA_REJECT',str(e))
bg=Image.new('RGBA',full[0].size,(102,204,255,255));bg.alpha_composite(full[0]);bg.save(p/'proposed-on-sky.png');(p/'seams.json').write_text(json.dumps([st],indent=2))
