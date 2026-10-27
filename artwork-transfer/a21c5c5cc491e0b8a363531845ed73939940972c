from PIL import Image
import numpy as np,sys,json
D=4.3515625;a=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int);edges=[]
for y in [1551,1551.5,1552,1552.5,1553]:
 row=a[round((y-1512)*D)];x=np.arange(row.shape[0])/D+144;mask=(row[:,2]>row[:,0]+30)&(row[:,1]>row[:,0]+15)&(row[:,2]>60)&(x>290)&(x<340);edges.append(float(x[mask].min()))
step=float(max(np.diff(edges)));print(json.dumps({'leftEdges':edges,'maxHalfPixelYEdgeStep':step,'limit':.9,'passed':step<=.9}));raise SystemExit(0 if step<=.9 else 1)
