import sys,json
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_overlap_cut,native_alpha_audit
s=m.read();left=next(t for t in s['tiles'] if t['id']=='r1c9');ref=[2320,148,312,312];rect=[2320,180,72,240]
rx,ry,rw,rh=left['referenceRect'];old=Image.open(m.ROOT/left['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS).crop((m.px(2320)-m.px(rx),m.py(180)-m.py(ry),m.px(2392)-m.px(rx),m.py(420)-m.py(ry)))
rx,ry,rw,rh=ref;full=Image.open('/Users/yanqs/.codex/generated_images/01a14de9-d7ab-71d3-b7a1-3c4ebc1459a8/exec-4d710c75-703b-49e2-8e1e-51de85060722.png').convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS);box=(0,m.py(180)-m.py(148),m.px(2392)-m.px(2320),m.py(420)-m.py(148));new=full.crop(box)
a,b=np.array(old),np.array(new);margin=round(16*m.DENSITY);oa=a[:,margin:-margin];nb=b[:,margin:-margin];mask,path,st=native_overlap_cut(Image.fromarray(oa),Image.fromarray(nb),transition=oa.shape[1],visibility=np.maximum(oa[:,:,3],nb[:,:,3])/255);print(json.dumps(st))
keep=np.zeros(a.shape[:2],bool);keep[:,margin:-margin]=mask;keep[:,-margin:]=True;mixed=np.where(keep[:,:,None],b,a);full.paste(Image.fromarray(mixed),(0,box[1]))
p=m.CACHE/'northeast-cloud-horizontal-native-reuse-r1';p.mkdir(exist_ok=True);old.save(p/'before.png');new.save(p/'donor-canonical.png');Image.fromarray(keep.astype('uint8')*255).save(p/'mask.png');Image.fromarray(mixed).save(p/'assembled.png');(p/'seams.json').write_text(json.dumps([st],indent=2))
try:print(native_alpha_audit(full))
except ValueError as e:print('ALPHA_REJECT',str(e))
bg=Image.new('RGBA',full.size,(102,204,255,255));bg.alpha_composite(full);bg.save(p/'proposed-on-sky.png')
