import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
out=m.WORK/'reviews/batch-23';out.mkdir(exist_ok=True);prior=m.WORK/'reviews/batch-22';rows=json.load(open(prior/'regions.json'));approved=json.load(open(prior/'approved-review-regions.json'))
for r in rows+approved:
 source=m.ROOT/'public/modern'/r['url']
 if '/reviews/batch-22/' not in r['url']:continue
 target=out/source.name;shutil.copy2(source,target);assert m.sha(source)==m.sha(target);r['url']=str(target.relative_to(m.ROOT/'public/modern'))
s=m.read();r=next(r for r in s['repairs'] if r['id']=='upper-cloud-complete-r2');source=m.ROOT/r['files']['assembled.png']['path'];assert m.sha(source)==r['files']['assembled.png']['sha256'];im=Image.open(source).convert('RGBA');path=out/(r['id']+'.webp');im.save(path,lossless=True,exact=True,method=6);assert np.array_equal(np.array(im),np.array(Image.open(path).convert('RGBA')));x,y,w,h=r['rect'];lx,ly=640+m.px(x)/m.DENSITY,420+m.py(y)/m.DENSITY
rows.append({'label':r['id'],'url':str(path.relative_to(m.ROOT/'public/modern')),'logicalRect':[lx,ly,im.width/m.DENSITY,im.height/m.DENSITY],'scenePosition':[lx-184,ly-313],'pixelDensity':m.DENSITY,'pixelSize':list(im.size),'sha256':m.sha(path),'coreRect':r['rect'],'replacementRect':r['rect'],'drawAfterApproved':True,'nativeAlphaModified':False,'completeNativeSprite':True,'status':'whole-cloud-review-only-not-production'})
(out/'regions.json').write_text(json.dumps(rows,indent=2)+'\n');(out/'approved-review-regions.json').write_text(json.dumps(approved,indent=2)+'\n');(out/'pending-jobs.json').write_text('[]\n');print(json.dumps({'regionCount':len(rows),'approvedParts':len(approved)}))
