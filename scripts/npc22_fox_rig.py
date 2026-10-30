"""Fox traffic policeman: fixed mothers, elbow gestures, landmark-anchored turns.

The six generated cells disagree in silhouette registration. The front mother
supplies the fixed body and both articulated arms. Actual intermediate head
surfaces use anatomical triangle correspondences, never optical flow.
"""
import math
import cv2
import numpy as np
from PIL import Image,ImageDraw


def _ease(t):
 t=max(0.,min(1.,t));return t*t*(3-2*t)


def _premul(image):
 a=np.asarray(image,dtype=np.float32)/255
 a[:,:,:3]*=a[:,:,3:4]
 return a


def _image(a):
 a=a.copy();a[:,:,:3]/=np.maximum(a[:,:,3:4],1/255)
 return Image.fromarray(np.rint(np.clip(a,0,1)*255).astype(np.uint8),'RGBA')


def _limb(mother,side,scale):
 """Cut the moving arm outside its sleeve; keep the shoulder socket fixed."""
 width,height=mother.size
 if side=='front':
  pivot=np.array([83.,118.])*scale;elbow=np.array([95.,118.])*scale
  rect=(82,112,113,125);split=95;direction=1
 else:
  pivot=np.array([33.,118.])*scale;elbow=np.array([19.,118.])*scale
  rect=(0,112,34,125);split=19;direction=-1
 rgba=np.asarray(mother).copy();x0,y0,x1,y1=[round(v*scale)for v in rect]
 mask=np.zeros((height,width),np.uint8);mask[y0:y1,x0:x1]=255
 # The white cheek overlaps the top of the arm rectangle. It belongs to the
 # stationary head; never rotate it along with the orange forearm.
 rgb=rgba[:,:,:3].astype(np.float32)
 orange=(rgb[:,:,0]>rgb[:,:,1]*1.3)&(rgb[:,:,1]>rgb[:,:,2]*1.25)
 mask[~orange]=0
 # Overlap the bend by two source pixels so the elbow never opens a seam.
 upper=mask.copy();lower=mask.copy()
 if direction==1:
  upper[:,round((split+1)*scale):]=0;lower[:,:round((split-1)*scale)]=0
 else:
  upper[:,:round((split-1)*scale)]=0;lower[:,round((split+1)*scale):]=0
 layers=[]
 for part in [upper,lower]:
  a=rgba.copy();a[:,:,3]=np.minimum(a[:,:,3],part);layers.append(_premul(Image.fromarray(a,'RGBA')))
 joint_mask=Image.new('L',(width,height))
 ImageDraw.Draw(joint_mask).ellipse((elbow[0]-4.5*scale,elbow[1]-4.5*scale,elbow[0]+4.5*scale,elbow[1]+4.5*scale),fill=255)
 joint=rgba.copy();joint[:,:,3]=np.minimum(joint[:,:,3],np.asarray(joint_mask))
 joint=_premul(Image.fromarray(joint,'RGBA'))
 rgba[:,:,3][mask>0]=0
 base=Image.fromarray(rgba,'RGBA')
 def sample(amount):
  if amount<=0:return mother.copy()
  angle=direction*30*amount;lower_angle=direction*165*amount
  radians=math.radians(angle)
  rotation=np.array([[math.cos(radians),-math.sin(radians)],[math.sin(radians),math.cos(radians)]])
  moved_elbow=pivot+rotation@(elbow-pivot)
  out=base.copy()
  for layer,origin,target,degrees in [(layers[0],pivot,pivot,angle),(joint,elbow,moved_elbow,0),(layers[1],elbow,moved_elbow,lower_angle)]:
   radians=math.radians(degrees);c,s=math.cos(radians),math.sin(radians)
   matrix=np.array([[c,-s,target[0]-c*origin[0]+s*origin[1]],[s,c,target[1]-s*origin[0]-c*origin[1]]],np.float32)
   out.alpha_composite(_image(cv2.warpAffine(layer,matrix,(width,height),flags=cv2.INTER_LINEAR)))
  return out
 return sample


# Sparse anatomical correspondences for front, three actual generated yaw
# angles, and original left-facing mother. These are never optical-flow fields.
_HEAD_POINTS=[[(57.0, 7.0), (31.0, 16.0), (83.0, 16.0), (32.0, 29.0), (44.0, 33.64), (56.0, 34.5), (68.0, 33.64), (80.0, 29.9),
  (31.0, 45.0), (44.0, 54.0), (57.0, 55.0), (70.0, 54.0), (83.0, 44.0), (56.9, 25.19), (23.0, 80.0), (48.0, 86.5),
  (46.0, 95.0), (25.0, 96.0), (65.0, 79.0), (91.0, 86.0), (89.0, 95.0), (67.0, 96.0), (35.0, 89.0), (77.0, 88.0),
  (57.14, 104.92), (20.0, 105.0), (94.0, 105.0), (56.0, 115.0)],
 [(59.0, 4.0), (34.0, 14.0), (89.0, 13.0), (34.0, 30.5), (46.0, 33.5), (58.0, 33.69), (71.0, 32.5), (83.0, 29.5),
  (22.0, 50.0), (37.0, 54.0), (52.0, 54.0), (66.0, 50.0), (81.0, 37.0), (46.82, 24.0), (16.0, 76.0), (34.0, 83.5),
  (32.0, 93.0), (18.0, 94.0), (50.0, 78.0), (80.0, 85.0), (78.0, 94.0), (52.0, 95.0), (24.0, 86.0), (61.0, 87.0),
  (36.52, 100.27), (18.0, 105.0), (85.0, 105.0), (45.0, 115.0)],
 [(56.0, 4.0), (29.0, 13.0), (85.0, 13.0), (31.0, 31.23), (42.0, 33.5), (54.0, 33.5), (66.0, 31.5), (78.0, 29.43),
  (15.0, 51.0), (30.0, 53.0), (44.0, 52.0), (59.0, 47.0), (74.0, 36.0), (37.17, 23.58), (12.0, 76.0), (22.0, 83.5),
  (20.0, 93.0), (14.0, 94.0), (37.0, 78.0), (65.0, 85.0), (63.0, 94.0), (39.0, 95.0), (17.0, 86.0), (48.0, 87.0),
  (21.84, 98.88), (18.0, 105.0), (70.0, 105.0), (39.0, 115.0)],
 [(58.0, 4.0), (28.0, 15.0), (86.0, 14.0), (29.0, 33.5), (40.0, 34.5), (52.0, 34.0), (65.0, 32.5), (76.0, 30.11),
  (14.0, 53.0), (29.0, 55.0), (44.0, 52.0), (58.0, 46.0), (73.0, 36.0), (32.57, 24.6), (11.0, 79.0), (17.0, 85.0),
  (15.0, 93.0), (13.0, 94.0), (31.0, 80.0), (59.0, 86.0), (57.0, 94.0), (33.0, 95.0), (14.0, 87.0), (40.0, 87.0),
  (16.44, 99.36), (16.0, 105.0), (65.0, 105.0), (37.0, 115.0)],
 [(55.0, 1.0), (28.0, 10.0), (83.0, 12.0), (24.0, 28.9), (35.0, 31.0), (46.0, 30.5), (58.0, 29.5), (70.0, 27.25),
  (9.0, 49.0), (23.0, 51.0), (36.0, 49.0), (50.0, 44.0), (64.0, 35.0), (52.12, 28.31), (5.0, 77.0), (13.0, 84.0),
  (11.0, 93.0), (7.0, 94.0), (24.0, 78.0), (53.0, 84.5), (51.0, 93.0), (26.0, 94.0), (9.0, 87.0), (35.0, 87.0),
  (10.15, 97.76), (11.0, 105.0), (57.0, 105.0), (35.0, 114.0)]]


def _mesh_pair(first,second,points_a,points_b,scale):
 width,height=first.size
 corners=[(0,0),(width-1,0),(width-1,height-1),(0,height-1)]
 p=np.vstack([corners,np.array(points_a,np.float32)*scale]).astype(np.float32)
 q=np.vstack([corners,np.array(points_b,np.float32)*scale]).astype(np.float32)
 midpoint=(p+q)/2
 subdiv=cv2.Subdiv2D((0,0,width,height))
 for x,y in midpoint:subdiv.insert((float(x),float(y)))
 triangles=[]
 for coordinates in subdiv.getTriangleList():
  vertices=np.array(coordinates).reshape(3,2)
  indices=[int(np.argmin(np.linalg.norm(midpoint-v,axis=1)))for v in vertices]
  if all(np.linalg.norm(midpoint[i]-v)<.1 for i,v in zip(indices,vertices)):triangles.append(indices)
 a,b=_premul(first),_premul(second)
 yy,xx=np.indices((height,width),dtype=np.float32)
 def sample(fraction):
  if fraction<=0:return first.copy()
  if fraction>=1:return second.copy()
  destination=p*(1-fraction)+q*fraction
  maps=[np.zeros((height,width,2),np.float32),np.zeros((height,width,2),np.float32)]
  for indices in triangles:
   target=destination[indices]
   mask=np.zeros((height,width),np.uint8);cv2.fillConvexPoly(mask,np.rint(target).astype(np.int32),1)
   selected=mask.astype(bool)
   for source,mapping in [(p,maps[0]),(q,maps[1])]:
    transform=cv2.getAffineTransform(target,source[indices])
    mapping[:,:,0][selected]=(transform[0,0]*xx+transform[0,1]*yy+transform[0,2])[selected]
    mapping[:,:,1][selected]=(transform[1,0]*xx+transform[1,1]*yy+transform[1,2])[selected]
  warped=[cv2.remap(texture,mapping[:,:,0],mapping[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)for texture,mapping in zip([a,b],maps)]
  # A single opaque silhouette prevents a dissolving double ear or ghost foot.
  def distance(alpha):
   inside=(alpha>.5).astype(np.uint8)
   return cv2.distanceTransform(inside,cv2.DIST_L2,3)-cv2.distanceTransform(1-inside,cv2.DIST_L2,3)
  result=warped[0]*(1-fraction)+warped[1]*fraction
  coverage=np.clip(distance(warped[0][:,:,3])*(1-fraction)+distance(warped[1][:,:,3])*fraction+.5,0,1)
  result[:,:,:3]/=np.maximum(result[:,:,3:4],1/255)
  result[:,:,3]=coverage;result[:,:,:3]*=coverage[:,:,None]
  return _image(result)
 return sample


def _head_and_body(image,scale,offset=0):
 a=np.asarray(image).copy();yy=np.indices(a.shape[:2])[0]-offset
 rgb=a[:,:,:3].astype(np.float32)
 # At the chin/shoulder overlap, white muzzle stays with the head. Blue shirt
 # and orange paws stay with the stationary body, preventing a rectangular cut.
 neutral=(rgb.max(axis=2)-rgb.min(axis=2)<40)&(rgb.mean(axis=2)>100)
 cold_blue=(rgb[:,:,2]>rgb[:,:,0]*1.1)&(rgb[:,:,2]>rgb[:,:,1]*.95)
 head_mask=(yy<round(100*scale))|((yy<round(110*scale))&~cold_blue)|((yy<round(119*scale))&neutral)
 head=a.copy();head[:,:,3][~head_mask]=0
 body=a.copy();body[:,:,3][head_mask]=0
 # Continue the small neck underside with the original front chin shadow.
 # The shirt and its collar remain in the stationary body layer.
 patch=Image.new('L',image.size)
 ImageDraw.Draw(patch).polygon([(round(x*scale)+offset,round(y*scale)+offset)for x,y in [(51,117),(51,111),(61,111),(62,117)]],fill=255)
 selected=np.asarray(patch)>0
 neck=a[round(116*scale)+offset,round(52*scale)+offset:round(61*scale)+offset,:3]
 color=np.median(neck,axis=0).astype(np.uint8)
 for y in range(round(111*scale)+offset,round(118*scale)+offset):
  empty=selected[y]&(body[y,:,3]==0)
  body[y,empty,:3]=color;body[y,empty,3]=253
 return Image.fromarray(head,'RGBA'),Image.fromarray(body,'RGBA')


def _turn(front,side,scale,root):
 atlas=Image.open(root/'public/hd-review/characters-22-23/npc-12-turn-master.png').convert('RGBA')
 pixels=np.asarray(atlas);padding=round(20*scale)
 width,height=front.width+2*padding,front.height+2*padding
 def padded(image):
  result=Image.new('RGBA',(width,height));result.alpha_composite(image,(padding,padding));return result
 images=[padded(front)];points=[[(x+20,y+20)for x,y in _HEAD_POINTS[0]]]
 # All heads retain a shared chin height and facial landmark registration.
 # Generation produced slightly smaller heads, so correct the common head
 # scale around each nose before compositing; generated feet are unused.
 for index,(center,nose)in enumerate(zip([471.75,1076.18,1710.59],[36,19,15]),1):
  source_nose=center+(nose-56)/.23
  matrix=np.array([[.26*scale,0,(nose-.26*source_nose+20)*scale],[0,.26*scale,(100-.26*((100-1.75)/.25)+20)*scale]],np.float32)
  images.append(Image.fromarray(cv2.warpAffine(pixels,matrix,(width,height),flags=cv2.INTER_LINEAR),'RGBA'))
  points.append([(x+20,y+20)for x,y in _HEAD_POINTS[index]])
 images.append(padded(side));points.append([(x+20,y+20)for x,y in _HEAD_POINTS[4]])
 heads=[_head_and_body(image,scale,padding)[0]for image in images]
 # Silhouette-normalized generated poses disagree at the neck. Register only
 # their head layers to the same fixed shirt socket; never move the body.
 for i,(dx,dy)in enumerate([(0,0),(0,2),(6,2),(6,3),(9,4)]):
  matrix=np.array([[1,0,dx*scale],[0,1,dy*scale]],np.float32)
  heads[i]=Image.fromarray(cv2.warpAffine(np.asarray(heads[i]),matrix,(width,height),flags=cv2.INTER_LINEAR),'RGBA')
  points[i]=[(x+dx,y+dy)for x,y in points[i]]
 head_pairs=[_mesh_pair(heads[i],heads[i+1],points[i],points[i+1],scale)for i in range(4)]
 body=_head_and_body(images[0],scale,padding)[1]
 side_fixed=body.copy();side_fixed.alpha_composite(heads[4])
 def sample(fraction):
  if fraction<=0:return front.copy()
  if fraction>=1:return side_fixed.copy()
  position=fraction*4;index=min(3,int(position));local=position-index
  out=body.copy();out.alpha_composite(head_pairs[index](local))
  return out
 return sample,heads[4]


def prepare_rig(npc,poses,density,canvas_rect,root,definition):
 """Return a deterministic 30-Hz source-time sampler on the registered canvas."""
 if npc!='npc-12':raise ValueError('Fox rig only supports npc-12')
 scale=density/2
 # Registered poses may include the builder's safety padding. Locate the
 # inspected reference canvas from the mother, never from a trimmed webp URL.
 bbox=poses[0].getbbox();left=bbox[0]-round(.35*density);top=bbox[1]-round(3.35*density)
 crop=(left,top,left+round(114*scale),top+round(174*scale))
 front,side=poses[0].crop(crop),poses[3].crop(crop)
 turn,side_head=_turn(front,side,scale,root)
 front_arm=_limb(front,'front',scale);left_arm=_limb(front,'side',scale)
 def side_arm(amount):
  body=_head_and_body(left_arm(amount),scale)[1]
  out=Image.new('RGBA',side_head.size);out.alpha_composite(body,(round(20*scale),round(20*scale)))
  out.alpha_composite(side_head)
  return out
 schedule=definition['framePoseIndicesZeroBased'];length=len(schedule)
 changes=[]
 for i in range(1,length):
  old,new=schedule[i-1]%3,schedule[i]%3
  if old!=new:changes.append((i,(new-old)/2))
 def local_sample(time):
  time=time%length
  # The original changes facing on source frame 41; distribute that turn over
  # the six preceding source frames and return during the final six.
  if 34<time<40:return turn(_ease((time-34)/6))
  if 75<time<81:return turn(1-_ease((time-75)/6))
  amount=sum(delta*_ease((time-cut+1.25)/2.5)for cut,delta in changes)
  amount=max(0.,min(1.,amount))
  return (front_arm if time<40 else side_arm)(amount)
 def sample(time):
  out=Image.new('RGBA',poses[0].size)
  image=local_sample(time)
  offset=round(20*scale)if image.size!=front.size else 0
  out.alpha_composite(image,(left-offset,top-offset))
  return out
 return sample
