"""Build only item22 HD bodies; source outer trajectories stay independent at runtime."""
from pathlib import Path
import hashlib
import json
import math
from functools import lru_cache
import numpy as np
from PIL import Image


def split_atlas(image,count,layout=None):
 import cv2
 columns=layout['columns']if layout else min(4,count)
 rows=layout['rows']if layout else math.ceil(count/columns)
 cells=layout.get('cells',list(range(count)))if layout else list(range(count));poses=[]
 if len(cells)!=count:raise ValueError('NPC atlas layout must name every pose cell')
 for index in range(count):
  column,row=cells[index]%columns,cells[index]//columns
  cell_rect=(round(column*image.width/columns),round(row*image.height/rows),round((column+1)*image.width/columns),round((row+1)*image.height/rows))
  cell=image.convert('RGBA').crop(cell_rect)
  original_alpha=np.asarray(cell.getchannel('A'));alpha=original_alpha
  opened=cv2.morphologyEx((alpha>8).astype(np.uint8),cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
  components,labels,stats,_=cv2.connectedComponentsWithStats(opened)
  largest=max(stats[1:,cv2.CC_STAT_AREA],default=0)
  keep=np.zeros(opened.shape,np.uint8)
  for component in range(1,components):
   x,y,width,height,area=stats[component]
   touches_border=x==0 or y==0 or x+width==cell.width or y+height==cell.height
   border_grid=touches_border and area<largest*.5 and (width>height*8 or height>width*8)
   if area>=max(20,largest*.005)and not border_grid:keep[labels==component]=1
  keep=cv2.dilate(keep,np.ones((3,3),np.uint8))
  alpha=Image.fromarray(alpha*keep,'L');cell.putalpha(alpha)
  bounds=alpha.point(lambda a:255 if a>8 else 0).getbbox()
  if bounds is None or np.asarray(alpha,dtype=float).sum()/255<cell.width*cell.height*.04:
   raise ValueError(f'empty or artifact-only NPC atlas pose {index}')
  pose=cell.crop(bounds)
  pose.info['atlasRect']=[cell_rect[0]+bounds[0],cell_rect[1]+bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]]
  pose.info['atlasCell']=list(cell_rect)
  pose.info['discardedAlphaPixels']=int(np.count_nonzero((original_alpha>8)&(np.asarray(alpha)<=8)))
  pose.info['discardedAlphaFraction']=pose.info['discardedAlphaPixels']/max(1,int(np.count_nonzero(original_alpha>8)))
  poses.append(pose)
 return poses

def register_pose(image,rect,canvas_rect,density):
 x0,y0,x1,y1=rect;left,top,right,bottom=canvas_rect
 canvas=Image.new('RGBA',(round((right-left)*density),round((bottom-top)*density)))
 registered=image.resize((round((x1-x0)*density),round((y1-y0)*density)),Image.Resampling.LANCZOS)
 canvas.alpha_composite(registered,(round((x0-left)*density),round((y0-top)*density)))
 return canvas

def pose_sample(schedule,time):
 time=time%len(schedule);tick=int(math.floor(time));current=schedule[tick]
 if all(p==current for p in schedule):return current,current,0
 start=tick
 while start>0 and schedule[start-1]==current:start-=1
 end=tick+1
 while end<len(schedule) and schedule[end]==current:end+=1
 following=schedule[end%len(schedule)]
 transition=max(start,end-3)
 if time<transition:return current,current,0
 return current,following,(time-transition)/(end-transition)

@lru_cache(maxsize=8)
def morph_fields(width,height,bytes_a,bytes_b):
 import cv2
 rgba_a=np.frombuffer(bytes_a,dtype=np.uint8).reshape(height,width,4).astype(np.float32)/255
 rgba_b=np.frombuffer(bytes_b,dtype=np.uint8).reshape(height,width,4).astype(np.float32)/255
 def gray(rgba):
  rgb=rgba[:,:,:3]*rgba[:,:,3:4]+(1-rgba[:,:,3:4])
  return cv2.cvtColor(np.ascontiguousarray(rgb*255,dtype=np.uint8),cv2.COLOR_RGB2GRAY)
 def centroid(rgba):
  alpha=rgba[:,:,3];ys,xs=np.indices(alpha.shape);mass=alpha.sum()
  return (float((xs*alpha).sum()/mass),float((ys*alpha).sum()/mass))
 ca,cb=centroid(rgba_a),centroid(rgba_b)
 def flow(first,second,delta):
  aligned=cv2.warpAffine(second,np.array([[1,0,-delta[0]],[0,1,-delta[1]]],dtype=np.float32),(first.shape[1],first.shape[0]),borderValue=255)
  field=cv2.optflow.createOptFlow_DeepFlow().calc(first,aligned,None)+np.array(delta,dtype=np.float32)
  field=cv2.GaussianBlur(field,(0,0),.7)
  residual=field-np.array(delta,dtype=np.float32)
  magnitude=np.linalg.norm(residual,axis=2,keepdims=True)
  limit=max(8,min(first.shape)*.30)
  return np.array(delta,dtype=np.float32)+residual*np.minimum(1,limit/np.maximum(magnitude,1e-6))
 ga,gb=gray(rgba_a),gray(rgba_b)
 ab=flow(ga,gb,(cb[0]-ca[0],cb[1]-ca[1]));ba=flow(gb,ga,(ca[0]-cb[0],ca[1]-cb[1]))
 return rgba_a,rgba_b,ab,ba


def morph_pair(a,b,fraction):
 if fraction<=0:return a.copy()
 if fraction>=1:return b.copy()
 import cv2
 rgba_a,rgba_b,ab,ba=morph_fields(a.width,a.height,a.tobytes(),b.tobytes())
 ys,xs=np.indices((a.height,a.width),dtype=np.float32)
 def warp(rgba,displacement,amount):
  mx=xs-amount*displacement[:,:,0];my=ys-amount*displacement[:,:,1]
  for _ in range(6):
   sampled=cv2.remap(displacement,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
   mx=.35*mx+.65*(xs-amount*sampled[:,:,0])
   my=.35*my+.65*(ys-amount*sampled[:,:,1])
  premul=rgba.copy();premul[:,:,:3]*=premul[:,:,3:4]
  return cv2.remap(premul,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 wa=warp(rgba_a,ab,fraction);wb=warp(rgba_b,ba,1-fraction)
 # Both textures reach the same intermediate geometry. Never switch the whole
 # visible surface at t=.5. Signed-distance silhouettes prevent two faint wings.
 def signed_distance(alpha):
  inside=(alpha>.5).astype(np.uint8)
  return cv2.distanceTransform(inside,cv2.DIST_L2,3)-cv2.distanceTransform(1-inside,cv2.DIST_L2,3)
 coverage=np.clip((1-fraction)*signed_distance(wa[:,:,3])+fraction*signed_distance(wb[:,:,3])+.5,0,1)
 rgba=(1-fraction)*wa+fraction*wb
 rgba[:,:,:3]/=np.maximum(rgba[:,:,3:4],1/255)
 rgba[:,:,3]=coverage
 return Image.fromarray(np.rint(np.clip(rgba,0,1)*255).astype(np.uint8),'RGBA')


def transformed_rect(rect,matrix):
 x0,y0,x1,y1=rect;a,b,c,d,tx,ty=matrix
 points=[(a*x+c*y+tx,b*x+d*y+ty)for x,y in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]]
 return min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)


def union_rect(rects):
 return min(r[0]for r in rects),min(r[1]for r in rects),max(r[2]for r in rects),max(r[3]for r in rects)


def source_body_rects(source,root_symbol,inner_frames):
 sprites={sprite['symbol']:sprite for sprite in source['sprites']}
 def bounds(symbol,index):
  sprite=sprites[symbol];layers=sprite['timeline'][index%sprite['frames']];rects=[]
  for layer in layers:
   native=bounds(layer['symbol'],layer['time'])if layer['symbol']in sprites else layer['bounds']
   rects.append(transformed_rect(native,layer['matrix']))
  return union_rect(rects)
 root=sprites[root_symbol]
 body=next(layer for layer in root['timeline'][0]if layer['depth']==2)
 rects=[transformed_rect(bounds(body['symbol'],index),body['matrix'])for index in range(inner_frames)]
 outer=[]
 for layers in root['timeline']:
  current=next(layer for layer in layers if layer['depth']==2)
  shadow=next(layer for layer in layers if layer['symbol']==217)
  m=shadow['matrix']
  outer.append({'x':current['matrix'][4]-body['matrix'][4],'y':current['matrix'][5]-body['matrix'][5],
   'shadowX':m[4],'shadowY':m[5],'shadowScaleX':m[0],'shadowScaleY':m[3]})
 return rects,outer


def build(root,partial=False,density=2,only=None):
 review=root/'public/hd-review/characters-22-23'
 source=json.loads((review/'source-timeline.json').read_text())
 indices=json.loads((review/'npc-pose-index.json').read_text())
 layouts=json.loads((review/'npc-atlas-layout.json').read_text())if(review/'npc-atlas-layout.json').exists()else{}
 output=root/'public/modern'
 result={'version':1,'status':'candidate-awaiting-user-review','scope':[22],
  'sourceSha256':'790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba',
  'worldClips':[],'motion':[],'runtimeImages':[]}
 qa=[];missing=[]
 for definition in indices:
  npc=definition['id'];master=review/f'{npc}-master.png'
  if only and npc not in only:missing.append(npc);continue
  if not master.exists():missing.append(npc);continue
  atlas=Image.open(master).convert('RGBA');poses=split_atlas(atlas,definition['uniqueCompositePoses'],layouts.get(npc))
  schedule=definition['framePoseIndicesZeroBased'];rects,outer=source_body_rects(source,definition['sourceSymbol'],len(schedule))
  union=union_rect(rects);canvas_rect=tuple([math.floor(v)for v in union[:2]]+[math.ceil(v)for v in union[2:]])
  first=definition['poseFirstFramesOneBased']
  registered=[register_pose(pose,rects[first[index]-1],canvas_rect,density)for index,pose in enumerate(poses)]
  frames=[];seen={};pose_samples=[]
  for frame in range(len(schedule)*2):
   a,b,fraction=pose_sample(schedule,frame/2)
   image=registered[a]if a==b or fraction==0 else morph_pair(registered[a],registered[b],fraction)
   bbox=image.getchannel('A').getbbox()
   trim=(math.floor(bbox[0]/density)*density,math.floor(bbox[1]/density)*density,
         min(image.width,math.ceil(bbox[2]/density)*density),min(image.height,math.ceil(bbox[3]/density)*density))
   cropped=image.crop(trim);digest=hashlib.sha256(cropped.tobytes()).hexdigest()
   url=seen.get(digest)
   if url is None:
    url=f'hd-characters/npc-22/{npc}/{len(seen)+1}.webp';seen[digest]=url
    target=output/url;target.parent.mkdir(parents=True,exist_ok=True)
    cropped.save(target,format='WEBP',lossless=True,method=4)
    result['runtimeImages'].append({'url':url,'source':url,'pixelSize':list(cropped.size),'pixelDensity':density,
     'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
   frames.append({'url':url,'width':cropped.width/density,'height':cropped.height/density,
    'offsetX':canvas_rect[0]+trim[0]/density,'offsetY':canvas_rect[1]+trim[1]/density})
   pose_samples.append({'frame':frame,'a':a,'b':b,'fraction':fraction})
  result['worldClips'].append({'id':npc,'sourceSymbol':definition['sourceSymbol'],'fps':60,'loop':True,'frames':frames})
  result['motion'].append({'id':npc,'sourceSymbol':definition['sourceSymbol'],'outerFps':30,'outerTrack':outer})
  qa.append({'id':npc,'masterSize':list(atlas.size),'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),
   'masterPoseRects':[pose.info['atlasRect']for pose in poses],'masterPoseCells':[pose.info['atlasCell']for pose in poses],
   'discardedAlphaPixels':[pose.info['discardedAlphaPixels']for pose in poses],
   'discardedAlphaFraction':[pose.info['discardedAlphaFraction']for pose in poses],
   'sourceBodyRects':rects,'canvasRect':canvas_rect,'sourceInnerFrames':len(schedule),'displayFrames':len(frames),
   'uniqueTextures':len(seen),'outerFrames':len(outer),'samples':pose_samples})
  print(f'{npc}: {len(frames)} display records, {len(seen)} unique textures',flush=True)
 if missing and not partial:raise SystemExit(f'Missing NPC masters: {missing}; use --partial only for provisional review')
 result['missingMasters']=missing
 decoded=sum(item['pixelSize'][0]*item['pixelSize'][1]*4 for item in result['runtimeImages'])
 qa_result={'status':'candidate-unaccepted','scope':[22],'missingMasters':missing,'decodedRgbaBytes':decoded,'clips':qa,
  'alphaExtraction':'Original masters remain byte-identical. A 5x5 opening identifies significant alpha components; retain components >=max(20px,0.5%largest), excluding thin non-primary edge strips (<50%largest, aspect>8). Dilate selected component mask by1px and intersect original alpha. This discards background/grid noise and may discard very thin isolated fringes; no colors or opaque interiors are repainted.',
  'sourceTimingNote':'Independent outer and inner playheads; original AVM1 loop-boundary child-reset behavior remains unverified.'}
 (root/'src/modern/data/npc-22.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 (review/'npc-22-runtime.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
 (review/'npc-22-verification.json').write_text(json.dumps(qa_result,ensure_ascii=False,indent=2)+'\n')
 canonical=[]
 for clip in result['worldClips']:
  record=next(item for item in qa if item['id']==clip['id'])
  canonical.append({'id':clip['id'],'frame':clip['frames'][0],'pixelDensity':density,'masterPoseRect':record['masterPoseRects'][0],
   'masterSha256':record['masterSha256'],'sourceBodyRect':record['sourceBodyRects'][0]})
 (review/'npc-22-canonical.json').write_text(json.dumps({'version':1,'status':'candidate-unaccepted','poses':canonical},indent=2)+'\n')
 print(f'NPC22 decoded texture bytes: {decoded}',flush=True)
 return result


if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true');parser.add_argument('--density',type=int,default=2)
 parser.add_argument('--only',help='Comma-separated NPC ids, for an explicitly partial preview')
 args=parser.parse_args();only={f'npc-{id}'for id in args.only.split(',')}if args.only else None
 build(Path(__file__).resolve().parents[1],args.partial,args.density,only)
