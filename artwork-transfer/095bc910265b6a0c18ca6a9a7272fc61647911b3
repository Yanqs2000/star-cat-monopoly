"""Catch the narrowed lower bridge by original outer-curb landmarks, not art style."""
import argparse,json
from pathlib import Path
from PIL import Image
import numpy as np
p=argparse.ArgumentParser();p.add_argument('image');p.add_argument('--density',type=float,default=2);p.add_argument('--origin',nargs=2,type=int,default=[0,0]);a=p.parse_args()
im=np.array(Image.open(a.image).convert('RGB'));rows=[]
for x,want in [(1420,1901),(1430,1895),(1440,1887)]:
 candidates=[]
 for y in range(want-8,want+30):
  c=im[round((y-a.origin[1])*a.density),round((x-a.origin[0])*a.density)].astype(int)
  if c.max()-c.min()<45 and c.mean()>90:candidates.append(y)
 got=candidates[0] if candidates else None
 rows.append(dict(x=x,expectedOriginalUpperY=want,observedUpperY=got,error=None if got is None else got-want,passed=got is not None and abs(got-want)<=4))
print(json.dumps({'image':a.image,'allowance':4,'samples':rows,'passed':all(r['passed'] for r in rows)},indent=2));raise SystemExit(0 if all(r['passed'] for r in rows) else 1)
