from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import numpy as np,json
P=Path(__file__).parent;D=4.3515625;old=Image.open(P/'cyan-joint-before.png').convert('RGBA');src=Image.open(P/'cyan-joint-source.png').convert('RGBA');h,w=np.array(old).shape[:2];xx=np.arange(w)/D+144;yy=np.arange(h)/D+1512;X,Y=np.meshgrid(xx,yy)
weight=np.clip((X-160)/12,0,1)*np.clip((344-X)/12,0,1)*np.clip((Y-1534)/10,0,1)*np.clip((1572-Y)/10,0,1)
# One complete coherent disc, with a feather only in its surrounding gray road.
ellipse=((X-324)/36)**2+((Y-1540)/26)**2
weight=np.maximum(weight,np.clip((1.10-ellipse)/.12,0,1));weight*=np.array(src)[:,:,3]/255
mask=Image.fromarray(np.rint(weight*255).astype('uint8'));new=Image.composite(src,old,mask);new.putalpha(old.getchannel("A"));a=np.array(old);b=np.array(new);assert np.array_equal(a[weight==0],b[weight==0]);assert np.array_equal(a[:,:,3],b[:,:,3]);new.save(P/'cyan-joint-fixed.png');mask.save(P/'cyan-joint-selection.png')
out=Image.new('RGBA',(w,h*2));out.paste(old,(0,0));out.paste(new,(0,h));out.resize((1280,960)).save(P/'cyan-joint-fixed-comparison.png')
(P/'cyan-joint-repair.json').write_text(json.dumps({'rect':[144,1512,256,96],'source':'reviews/batch-26/r6c1.webp','method':'restore the whole cyan disc from one coherent native source and feather shared grass/curb/asphalt context','existingRedDiscPreserved':True,'outsideSelectionUnchanged':True,'alphaUnchanged':True,'sameNativeDensity':D},indent=2))
