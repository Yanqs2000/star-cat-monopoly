import sys,json,shutil
from pathlib import Path
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
s=m.read();backup=m.CACHE/'batch24-before'
if not backup.exists():
 backup.mkdir();shutil.copy2(m.STATE,backup/'generation.json');shutil.copy2(m.WORK/'goal-order.json',backup/'goal-order.json');shutil.copytree(m.WORK/'assembled',backup/'assembled')

def quilt(rect,include_preview=True):
 x,y,w,h=rect;im=Image.new('RGBA',(m.px(x+w)-m.px(x),m.py(y+h)-m.py(y)))
 def add(r,p):
  ox,oy,ow,oh=r;a,b=max(x,ox),max(y,oy);c,d=min(x+w,ox+ow),min(y+h,oy+oh)
  if a<c and b<d:
   part=p.crop((m.px(a)-m.px(ox),m.py(b)-m.py(oy),m.px(c)-m.px(ox),m.py(d)-m.py(oy)))
   im.paste(part,(m.px(a)-m.px(x),m.py(b)-m.py(y)))
 for t in s['tiles']:
  if m.is_ready(t) or (include_preview and t['id'] in ['r6c1','r3c9','r4c9'] and t['status']=='pending-visual-review'):
   add(t['rect'],Image.open(m.WORK/'assembled'/f"{t['id']}.png").convert('RGBA'))
 for p in s['partialReviewRegions']:
  if p['repairId']=='tomorrow-city-sign-r1':continue
  ox,oy,ow,oh=p['rect'];pim=Image.open(m.ROOT/p['assembledPath']).convert('RGBA')
  for a,b,c,d in p.get('exportRects',[p['rect']]):
   add([a,b,c,d],pim.crop((m.px(a)-m.px(ox),m.py(b)-m.py(oy),m.px(a+c)-m.px(ox),m.py(b+d)-m.py(oy))))
 for repair in s['repairs']:
  if repair.get('reviewOverlayAfterApproved'):add(repair['rect'],Image.open(m.ROOT/repair['files']['assembled.png']['path']).convert('RGBA'))
 return im
