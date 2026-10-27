from PIL import Image
from pathlib import Path
import numpy as np,json
p=Path(__file__).parent;a=np.array(Image.open(p/'bridge-native-before.png').convert('RGB')).astype(int);b=np.array(Image.open(p/'bridge-native-candidate.png').convert('RGB')).astype(int)
old_neutral=a.max(2)-a.min(2)<45
new_bright_color=(b.max(2)-b.min(2)>95)&(b[:,:,0]<170)&(b[:,:,1]+b[:,:,2]>300)
n=int((old_neutral&new_bright_color).sum());print(json.dumps({'newSaturatedMarkerPixelsOnPreviouslyNeutralRoad':n,'passed':n==0}));raise SystemExit(0 if n==0 else 1)
