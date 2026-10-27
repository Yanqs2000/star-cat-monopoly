from pathlib import Path
from PIL import Image
import numpy as np,json,sys
P=Path(__file__).parent;spec=json.loads((P/'stencils.json').read_text());image=Image.open(sys.argv[1]).convert('RGB');density=float(sys.argv[2]);ox=float(sys.argv[3]) if len(sys.argv)>3 else 0;oy=float(sys.argv[4]) if len(sys.argv)>4 else 0
results=[]
for name,s in spec.items():
 x,y,w,h=s['referenceRect'];actual=np.array(image.crop((round((x-ox)*density),round((y-oy)*density),round((x+w-ox)*density),round((y+h-oy)*density))).resize((w,h),Image.Resampling.LANCZOS)).astype(int);white=(actual.min(2)>210)&(actual.max(2)-actual.min(2)<35);expected=np.array(Image.open(P/f'{name}-original-stencil.png'))>0;recall=float((white&expected).sum()/expected.sum());results.append({'name':name,'originalPaintCoverage':recall,'passed':recall>=.90})
# The original arrow ends at y939; the misplaced generated arrow left paint below945.
a=np.array(image.crop((round((1157-ox)*density),round((945-oy)*density),round((1191-ox)*density),round((956-oy)*density))).resize((34,11),Image.Resampling.LANCZOS)).astype(int);ghost=int(((a.min(2)>210)&(a.max(2)-a.min(2)<35)).sum());results.append({'name':'no-old-arrow-ghost','whitePixels':ghost,'passed':ghost<=4})
print(json.dumps({'checks':results,'passed':all(r['passed'] for r in results)},indent=2));raise SystemExit(0 if all(r['passed'] for r in results) else 1)
