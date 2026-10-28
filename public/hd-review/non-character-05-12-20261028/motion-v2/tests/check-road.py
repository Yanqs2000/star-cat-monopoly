from PIL import Image
import numpy as np,json,sys
from pathlib import Path
r=Path(sys.argv[1]);a=np.array(Image.open(r/'road-0.png').convert('RGB'),dtype=float);b=np.array(Image.open(r/'road-3.png').convert('RGB'),dtype=float);h,w=a.shape[:2];mask=np.zeros((h,w),bool);mask[int(45*h/120):int(85*h/120),int(15*w/95):int(50*w/95)]=True;mask&=(b[:,:,0]>150)&(b[:,:,1]>45)&(b[:,:,1]<210)&(b[:,:,2]<90);assert mask.sum()>50,'plank sampling region missing';error=np.abs(a-b)[mask].mean();result={'stablePlankMeanRgbError':float(error),'samplePixels':int(mask.sum()),'pass':bool(error<=2)};print(result);(r/'road-stability.json').write_text(json.dumps(result,indent=2)+'\n');sys.exit(0 if result['pass'] else 1)
