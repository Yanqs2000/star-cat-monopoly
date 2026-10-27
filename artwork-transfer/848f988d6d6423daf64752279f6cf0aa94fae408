import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
folder=m.WORK/'native-reuse/northeast-corner-v1';assert not folder.exists();folder.mkdir(parents=True)
oldpath=m.WORK/'reviews/batch-20/r2c5.webp';oldim=Image.open(oldpath).convert('RGBA').crop((0,0,m.px(1152)-m.px(1120),m.py(452)))
t=next(t for t in m.read()['tiles'] if t['id']=='r1c4');rx,ry,rw,rh=t['referenceRect'];northpath=m.ROOT/t['selectedMaster']
native=Image.open(northpath).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
northim=native.crop((m.px(1120)-m.px(rx),m.py(420)-m.py(ry),m.px(1152)-m.px(rx),m.py(452)-m.py(ry)))
old=np.array(oldim);new=np.array(northim);bg=Image.new('RGBA',oldim.size,(102,204,255,255))
a=np.array(Image.alpha_composite(bg,oldim))[:,:,:3].astype(float);b=np.array(Image.alpha_composite(bg,northim))[:,:,:3].astype(float)
diff=np.abs(a-b);energy=(diff**2).mean(axis=2).T
# Select a free-ended seam on common opaque neutral road/curb pixels. The
# comparison matte and material classification never modify output pixels.
allowed=((np.ptp(a,axis=2)<20)&(np.ptp(b,axis=2)<20)&(old[:,:,3]>=240)&(new[:,:,3]>=240)).T
allowed[m.px(1136)-m.px(1120):,m.py(440):]=False
energy[~allowed]=1e15;parents=np.zeros(energy.shape,np.int32);previous=energy[0].copy();columns=np.arange(energy.shape[1])
for row in range(1,energy.shape[0]):
 padded=np.pad(previous,(2,2),constant_values=np.inf);choices=np.stack([padded[i:i+energy.shape[1]] for i in range(5)]);chosen=choices.argmin(axis=0);parents[row]=columns+chosen-2;previous=energy[row]+choices[chosen,columns]
path=np.empty(energy.shape[0],np.int32);path[-1]=previous.argmin()
for row in range(len(path)-1,0,-1):path[row-1]=parents[row,path[row]]
assert allowed[np.arange(len(path)),path].all();mask=np.arange(old.shape[0])[:,None]<path[None,:];mixed=np.where(mask[:,:,None],new,old)
samples=diff.transpose(1,0,2)[np.arange(len(path)),path].mean(axis=1)
stats={'meanRgbDifference':float(samples.mean()),'p95RgbDifference':float(np.quantile(samples,.95)),'cutMinY':int(path.min()),'cutMaxY':int(path.max()),'green30NativePixelsReplaced':int(mask[m.py(440):,m.px(1136)-m.px(1120):].sum()),'alphaAudit':native_alpha_audit(Image.fromarray(mixed))}
assert stats['meanRgbDifference']<=12 and stats['p95RgbDifference']<=40 and stats['green30NativePixelsReplaced']==0
oldim.save(folder/'old.png');northim.save(folder/'north.png');Image.fromarray(mask.astype('uint8')*255).save(folder/'mask.png');Image.fromarray(mixed).save(folder/'assembled.png');(folder/'cut-stats.json').write_text(json.dumps(stats,indent=2)+'\n')
files={n:{'path':str((folder/n).relative_to(m.ROOT)),'sha256':m.sha(folder/n)} for n in ['old.png','north.png','mask.png','assembled.png','cut-stats.json']}
metadata={'rect':[1120,420,32,32],'sourceOldAtlas':{'path':str(oldpath.relative_to(m.ROOT)),'sha256':m.sha(oldpath),'pixelCrop':[0,0,oldim.width,oldim.height]},'sourceNorthMaster':{'path':str(northpath.relative_to(m.ROOT)),'sha256':m.sha(northpath),'referenceRect':t['referenceRect']},'files':files,'method':'Exact old or north native RGBA pixel selection on common opaque road/curb; no painting, blending or alpha edits','nativeAlphaModified':False,'protectedGreen30Rect':[1136,440,16,12],'stats':stats}
(folder/'sources.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n');print(json.dumps(stats))
