"""Item25 canonical layer packing. Never infer motion from changing pose bounds."""
from pathlib import Path
import json,math,hashlib
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageChops,ImageFilter

ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'public/hd-review/characters-25'
FACINGS=['down-right','down-left','up-left','up-right']

def clean_pose(image):
 rgba=image.convert('RGBA');alpha=np.asarray(rgba.getchannel('A'))
 count,labels,stats,_=cv2.connectedComponentsWithStats((alpha>8).astype(np.uint8))
 largest=max(stats[1:,cv2.CC_STAT_AREA],default=0)
 keep=np.zeros(alpha.shape,np.uint8)
 for index in range(1,count):
  if stats[index,cv2.CC_STAT_AREA]>=max(8,largest*.0005):keep[labels==index]=1
 keep=cv2.dilate(keep,np.ones((3,3),np.uint8))
 rgba.putalpha(Image.fromarray(alpha*keep))
 return rgba

def split_views(image,columns,rows):
 image=image.convert('RGBA');views=[]
 if rows==1 and columns>=2:
  alpha=np.asarray(image.getchannel('A'))
  count,labels,stats,centers=cv2.connectedComponentsWithStats((alpha>8).astype(np.uint8))
  candidates=sorted(range(1,count),key=lambda i:stats[i,cv2.CC_STAT_AREA],reverse=True)[:columns]
  if len(candidates)!=columns:raise ValueError('complete neutral figures are required')
  candidates.sort(key=lambda i:centers[i,0]);core_x=np.array([centers[i,0]for i in candidates])
  owners=np.zeros(labels.shape,np.uint8)
  largest=max(stats[1:,cv2.CC_STAT_AREA])
  for component in range(1,count):
   if stats[component,cv2.CC_STAT_AREA]<max(8,largest*.0005):continue
   owner=int(np.argmin(np.abs(core_x-centers[component,0])))+1
   owners[labels==component]=owner
  for index in range(columns):
   keep=cv2.dilate((owners==index+1).astype(np.uint8),np.ones((3,3),np.uint8))
   pose=image.copy();pose.putalpha(Image.fromarray(alpha*keep));bbox=pose.getchannel('A').getbbox()
   if bbox is None:raise ValueError('missing neutral view')
   pose=pose.crop(bbox);pose.info['masterRect']=[bbox[0],bbox[1],pose.width,pose.height];views.append(pose)
  return views
 # Assign whole connected figures by their centre. In the paired atlas, a
 # child's foot can extend below the nominal row without belonging to the
 # next pose. Rectangular cell crops would silently remove that foot.
 alpha=np.asarray(image.getchannel('A'))
 count,labels,stats,centers=cv2.connectedComponentsWithStats((alpha>8).astype(np.uint8))
 owners=np.zeros(alpha.shape,np.uint8);largest=max(stats[1:,cv2.CC_STAT_AREA],default=0)
 for component in range(1,count):
  if stats[component,cv2.CC_STAT_AREA]<max(8,largest*.0005):continue
  column=min(columns-1,int(centers[component,0]*columns/image.width));row=min(rows-1,int(centers[component,1]*rows/image.height))
  owners[labels==component]=row*columns+column+1
 for index in range(rows*columns):
  keep=cv2.dilate((owners==index+1).astype(np.uint8),np.ones((3,3),np.uint8))
  pose=image.copy();pose.putalpha(Image.fromarray(alpha*keep));bbox=pose.getchannel('A').getbbox()
  if bbox is None:raise ValueError('empty atlas cell')
  pose=pose.crop(bbox);pose.info['masterRect']=[bbox[0],bbox[1],pose.width,pose.height];views.append(pose)
 return views

def isolated_views(image,columns,rows):
 views=split_views(image,columns,rows)
 for i,part in enumerate(views):
  alpha=np.asarray(part.getchannel('A'));count,labels,stats,_=cv2.connectedComponentsWithStats((alpha>128).astype(np.uint8))
  primary=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
  keep=cv2.dilate((labels==primary).astype(np.uint8),np.ones((5,5),np.uint8))
  part.putalpha(Image.fromarray(alpha*keep));views[i]=part.crop(part.getbbox())
 return views

def split_expression_views(image,row_bounds=None,cell_rects=None):
 if row_bounds is None and cell_rects is None:return split_views(image,4,3)
 # An authored gutter separates heads whose faint glass alpha fringe touches
 # the next row. Connected-component assignment would merge two whole heads.
 views=[]
 rects=cell_rects or [(round(col*image.width/4),y0,round((col+1)*image.width/4),y1)for y0,y1 in zip(row_bounds,row_bounds[1:])for col in range(4)]
 for rect in rects:
  cell=clean_pose(image.crop(rect));bbox=cell.getbbox()
  if bbox is None:raise ValueError('empty authored expression cell')
  views.append(cell.crop(bbox))
 return views

def register_part(image,pivot,density,url,axis=None):
 bbox=image.getchannel('A').getbbox()
 if bbox is None:raise ValueError(f'empty layer:{url}')
 image=image.crop(bbox)
 info={'url':url,'width':image.width,'height':image.height,'pivot':[(pivot[0]-bbox[0])/density,(pivot[1]-bbox[1])/density]}
 if axis is not None:info['axis']=[axis[0]/density,axis[1]/density]
 return image,info

def reference_surface(spec,stop_at_end=False):
 source=Image.open(REVIEW/spec['sourceMaster']).convert('RGBA');mask=polygon(source.size,spec['sourcePolygon'])
 if stop_at_end:
  root=spec['sourcePivot'];axis=spec['sourceAxis'];mask=stop_at_joint(mask,root,[root[0]+axis[0],root[1]+axis[1]])
 image=masked(source,mask);box=image.getbbox();image=image.crop(box)
 factor=spec.get('sourceScale',1);root=spec['sourcePivot'];pivot=[(root[0]-box[0])*factor,(root[1]-box[1])*factor]
 image=image.resize((max(1,round(image.width*factor)),max(1,round(image.height*factor))),Image.Resampling.LANCZOS)
 donor={'master':spec['sourceMaster']}
 if 'sourceAxis'in spec:donor['axis']=[v*factor for v in spec['sourceAxis']]
 if 'sourceWidth'in spec:
  horizontal=spec['sourceWidth']/image.width;image=image.resize((spec['sourceWidth'],image.height),Image.Resampling.LANCZOS);pivot[0]*=horizontal
  if 'axis'in donor:donor['axis'][0]*=horizontal
 return image,pivot,donor

def reference_surfaces(specs):
 # Assemble complete source surfaces around one anatomical body pivot.
 layers=[(*reference_surface(spec),spec.get('at',[0,0]))for spec in specs]
 left=math.floor(min(at[0]-pivot[0]for image,pivot,donor,at in layers));top=math.floor(min(at[1]-pivot[1]for image,pivot,donor,at in layers))
 right=math.ceil(max(at[0]-pivot[0]+image.width for image,pivot,donor,at in layers));bottom=math.ceil(max(at[1]-pivot[1]+image.height for image,pivot,donor,at in layers))
 image=Image.new('RGBA',(right-left,bottom-top))
 for source,pivot,donor,at in layers:image.alpha_composite(source,(round(at[0]-pivot[0]-left),round(at[1]-pivot[1]-top)))
 return image,[-left,-top],{'master':specs[0]['sourceMaster'],'sources':specs}

def polygon(size,points):
 mask=Image.new('L',size);ImageDraw.Draw(mask).polygon([tuple(p)for p in points],fill=255);return mask

def capsule(size,a,b,r):
 mask=Image.new('L',size);draw=ImageDraw.Draw(mask)
 draw.line([tuple(a),tuple(b)],fill=255,width=round(r*2))
 for x,y in [a,b]:draw.ellipse((x-r,y-r,x+r,y+r),fill=255)
 return mask

def stop_at_joint(mask,a,b,padding=7):
 # The end cap belongs to the independent palm/boot. Keeping the old full
 # sole inside a rotating shin creates an extra triangular toe in motion.
 length=math.dist(a,b);u=[(b[0]-a[0])/length,(b[1]-a[1])/length];extent=max(mask.size)*3
 n=[-u[1]*extent,u[0]*extent];start=[a[0]-u[0]*extent,a[1]-u[1]*extent];end=[b[0]+u[0]*padding,b[1]+u[1]*padding]
 half=polygon(mask.size,[[start[0]-n[0],start[1]-n[1]],[start[0]+n[0],start[1]+n[1]],[end[0]+n[0],end[1]+n[1]],[end[0]-n[0],end[1]-n[1]]])
 return ImageChops.darker(mask,half)

def masked(image,mask):
 result=image.copy();result.putalpha(ImageChops.multiply(image.getchannel('A'),mask));return result

def neutral_cloth_mask(image,min_y=0):
 rgba=np.array(image).astype(int);rgb=rgba[:,:,:3]
 selected=(rgb.max(2)-rgb.min(2)<=28)&(rgb.min(2)>=20)&(rgba[:,:,3]>0)
 selected[:min_y]=False
 return Image.fromarray(np.where(selected,255,0).astype(np.uint8))

def neck_base(image):
 alpha=np.asarray(image.getchannel('A'));ys,xs=np.where(alpha>128)
 bottom=int(ys.max());near=(ys>=bottom-8)
 return float(np.median(xs[near])),bottom

def complete_edges(pose,layers,forbidden=None,min_alpha=0):
 # Recover source pixels just outside a hand-authored mask by extending the
 # nearest existing piece. No RGB is invented and no source image is changed.
 alpha=np.asarray(pose.getchannel('A'));union=np.zeros(alpha.shape,bool)
 for mask,_,_ in layers.values():union|=np.asarray(mask)>0
 ys,xs=np.where((alpha>min_alpha)&~union)
 if not len(xs):return
 names=list(layers);distances=[]
 for name in names:
  mask=layers[name][0];d=cv2.distanceTransform((np.asarray(mask)==0).astype(np.uint8),cv2.DIST_L2,3)[ys,xs]
  if forbidden and name in forbidden:d[np.asarray(forbidden[name])[ys,xs]>0]=np.inf
  distances.append(d)
 distances=np.array(distances);owners=distances.argmin(0)
 if distances.min(0).max()>22:raise ValueError('source silhouette outside anatomical masks; adjust authoring landmarks')
 for i,name in enumerate(names):
  selected=owners==i;array=np.array(layers[name][0]);array[ys[selected],xs[selected]]=255
  _,pivot,axis=layers[name];layers[name]=(Image.fromarray(array),pivot,axis)

def build_role(author):
 """One explicitly selected identity; source artwork is never modified."""
 cid=author['id'];density=author['density'];stem=author.get('outputStem',f'role-{cid:02d}');prefix=f'hd-characters/characters-25/{stem}'
 output=ROOT/'public/modern'/prefix;output.mkdir(parents=True,exist_ok=True)
 master=Image.open(REVIEW/author['neutralMaster']).convert('RGBA')
 views=split_views(master,*author['layout'])
 torso_views=split_views(Image.open(REVIEW/author['cleanTorsoMaster']),4,1)if author.get('cleanTorsoMaster')else None
 head_views=split_views(Image.open(REVIEW/author['headMaster']),*author.get('headLayout',[4,1]))if author.get('headMaster')else None
 foot_views=split_views(Image.open(REVIEW/author['footMaster']),4,2)if author.get('footMaster')else None
 appendage_views=isolated_views(Image.open(REVIEW/author['appendageMaster']),4,2)if author.get('appendageMaster')else None
 leg_views=isolated_views(Image.open(REVIEW/author['legMaster']),4,2)if author.get('legMaster')else None
 expressions=split_expression_views(Image.open(REVIEW/author['expressionMaster']),author.get('expressionRowBounds'),author.get('expressionCellRects'))if author.get('expressionMaster')else None
 source=json.loads((REVIEW/'source-index.json').read_text())
 native=next(r for r in source['roles']if r['id']==cid)
 rig={k:author[k]for k in ['id','name','anatomy','density','mapAnchor','stridePx','motionScale']}
 if 'artworkSamples'in author:rig['artworkSamples']=author['artworkSamples']
 rig['sourceSwfSha256']=native['sourceSwfSha256'];rig['facings']={};runtime=[];coverage=[]
 for index,facing in enumerate(FACINGS):
  entry=author['facings'][index];origin=entry['origin'];pose=Image.new('RGBA',master.size)
  source_view=views[entry.get('viewIndex',index)]
  rect=source_view.info['masterRect'];pose.alpha_composite(source_view,(rect[0],rect[1]))
  source_pose=pose;actors=[];combined_mask=Image.new('L',master.size)
  for description in entry['actors']:
   pose=masked(source_pose,polygon(master.size,description['sourcePolygon']))if description.get('sourcePolygon')else source_pose
   actor={'id':description['id'],'joints':{},'parts':{},'head':'head','body':'body','legs':[],'arms':[],'appendages':[],'order':[]}
   head_master=description.get('headMaster',author.get('headMaster'))
   actor_heads=split_views(Image.open(REVIEW/head_master),*description.get('headLayout',[4,1]))if description.get('headMaster')else head_views
   if description.get('expressionAtlasIndices') is not None:
    atlas=split_views(Image.open(REVIEW/description['expressionMaster']),*description['expressionLayout'])
    actor_expressions=[atlas[i]for i in description['expressionAtlasIndices']]
   else:actor_expressions=split_expression_views(Image.open(REVIEW/description['expressionMaster']),description.get('expressionRowBounds'),description.get('expressionCellRects'))if description.get('expressionMaster')else expressions
   neck_rows=description.get('expressionNeckRows',author.get('expressionNeckRows'))
   joints={**description['joints']};masks={};layers={}
   headmask=polygon(master.size,description['headPolygon'])
   protected=Image.new('L',master.size)
   for points in description.get('protectedPolygons',[]):protected=ImageChops.lighter(protected,polygon(master.size,points))
   head_exclusions=protected
   if 'headClothExclusionBelow'in author:head_exclusions=ImageChops.lighter(protected,neutral_cloth_mask(pose,author['headClothExclusionBelow']))
   headmask=ImageChops.subtract(headmask,head_exclusions);masks['head']=headmask;layers['head']=(headmask,joints['neck'],None)
   extras=Image.new('L',master.size);extra_exclusions={};extra_transfers=[]
   for extra in description['extras']:
    mask=polygon(master.size,extra['polygon']);mask=ImageChops.subtract(mask,headmask)
    if extra.get('excludeCloth',False):
     exclusion=neutral_cloth_mask(pose);removed=ImageChops.darker(mask,exclusion)
     extra_transfers.append((extra['clothOwner'],removed));mask=ImageChops.subtract(mask,exclusion);extra_exclusions[extra['name']]=exclusion
    extras=ImageChops.lighter(extras,mask);layers[extra['name']]=(mask,extra['pivot'],extra.get('axis'))
    joints[extra['followJoint']]=extra['pivot'];actor['appendages'].append({'part':extra['name'],'joint':extra['followJoint'],'kind':extra['kind'],**{k:extra[k]for k in['amplitude','phase','poseHand','maxAngle','readyProp','restAngle','parentPart','hurtRotation']if k in extra}})
   for owner,removed in extra_transfers:
    mask,pivot,axis=layers[owner];layers[owner]=(ImageChops.lighter(mask,removed),pivot,axis);extras=ImageChops.lighter(extras,removed)
   body=ImageChops.lighter(polygon(master.size,description['bodyPolygon']),protected)
   body=ImageChops.subtract(body,ImageChops.lighter(headmask,extras));layers['body']=(body,joints['spine'],None)
   body_exclusions=Image.new('L',master.size)
   for points in description.get('bodyExclusionPolygons',[]):body_exclusions=ImageChops.lighter(body_exclusions,polygon(master.size,points))
   body=ImageChops.subtract(body,body_exclusions);layers['body']=(body,joints['spine'],None)
   for family in ['legs','arms']:
    for limb in description[family]:
     name=limb['name'];root,middle,end=(limb[k]for k in (['hip','knee','ankle']if family=='legs'else['shoulder','elbow','hand']))
     keys=[name+('Hip'if family=='legs'else'Shoulder'),name+('Knee'if family=='legs'else'Elbow'),name+('Foot'if family=='legs'else'Hand')]
     joints.update(dict(zip(keys,[root,middle,end])))
     upper=name+('Thigh'if family=='legs'else'UpperArm');lower=name+('Shin'if family=='legs'else'Forearm');tip=name+('Foot'if family=='legs'else'Hand')
     radius=limb.get('radius',26)
     exclusions=ImageChops.lighter(headmask,ImageChops.lighter(extras,protected))
     if family=='legs':
      for other in description['legs']:
       if other['name']!=name and other.get('footPolygon'):exclusions=ImageChops.lighter(exclusions,polygon(master.size,other['footPolygon']))
     for part,a,b in [(upper,root,middle),(lower,middle,end)]:
      mask=stop_at_joint(ImageChops.subtract(capsule(master.size,a,b,radius),exclusions),a,b)
      if family=='arms'and not limb.get('sourcePolygon'):
       keep_root=capsule(master.size,root,root,22)
       mask=ImageChops.subtract(mask,ImageChops.subtract(body,keep_root))
      if limb.get('sourcePolygon'):mask=ImageChops.darker(mask,polygon(master.size,limb['sourcePolygon']))
      if ('upper'if part==upper else'lower')in limb.get('occludedSegments',[]):continue
      layers[part]=(mask,a,[b[0]-a[0],b[1]-a[1]])
     if family=='legs':
      mask=Image.new('L',master.size);ImageDraw.Draw(mask).rectangle(limb['footBox'],fill=255)
     else:mask=capsule(master.size,end,end,limb['palmRadius'])
     layers[tip]=(ImageChops.subtract(mask,exclusions),end,None)
     if family=='arms'and not author.get('handsMayOverlapBody',False):layers[tip]=(ImageChops.subtract(layers[tip][0],body),end,None)
     if limb.get('sourcePolygon'):layers[tip]=(ImageChops.darker(layers[tip][0],polygon(master.size,limb['sourcePolygon'])),end,None)
     if limb.get('footPolygon'):layers[tip]=(ImageChops.darker(layers[tip][0],polygon(master.size,limb['footPolygon'])),end,None)
     bend=1 if (end[0]-root[0])*(middle[1]-root[1])-(end[1]-root[1])*(middle[0]-root[0])>0 else -1
     actor[family].append({'name':name,'root':keys[0],'middle':keys[1],'end':keys[2],'upper':upper,'lower':lower,'tip':tip,'phase':limb.get('phase',0),'bend':bend,'lengths':[math.dist(root,middle)/density,math.dist(middle,end)/density],'hiddenParts':limb.get('occludedSegments',[])})
   complete_edges(pose,layers,{'body':body_exclusions,'head':head_exclusions,**extra_exclusions},author.get('edgeAlphaThreshold',0))
   # Source boot surfaces have one owner. The near boot occludes the far
   # boot in the canonical view; edge recovery must not put that occluder
   # into the far shoe or a rotating calf/thigh.
   boot_regions=[polygon(master.size,l['footPolygon'])for l in description['legs']]
   boot_union=Image.new('L',master.size)
   for region in boot_regions:boot_union=ImageChops.lighter(boot_union,region)
   owners=[]
   for i,region in enumerate(boot_regions):
    owner=region
    for front in boot_regions[i+1:]:owner=ImageChops.subtract(owner,front)
    owners.append(owner)
   def give_boot_pixels(mask):
    for leg,owner in zip(description['legs'],owners):
     tip=leg['name']+'Foot';m,p,a=layers[tip]
     layers[tip]=(ImageChops.lighter(m,ImageChops.darker(mask,owner)),p,a)
   for leg in description['legs']:
    for name in[leg['name']+'Thigh',leg['name']+'Shin']:
     mask,pivot,axis=layers[name];clipped=ImageChops.subtract(mask,boot_union)
     give_boot_pixels(ImageChops.subtract(mask,clipped))
     if name.endswith('Shin'):
      stopped=stop_at_joint(clipped,leg['knee'],leg['ankle'],padding=0)
      tip=leg['name']+'Foot';m,p,a=layers[tip]
      layers[tip]=(ImageChops.lighter(m,ImageChops.subtract(clipped,stopped)),p,a);clipped=stopped
     layers[name]=(clipped,pivot,axis)
   for i,leg in enumerate(description['legs']):
    tip=leg['name']+'Foot';mask,pivot,axis=layers[tip];clipped=mask
    for j,owner in enumerate(owners):
     if i!=j:clipped=ImageChops.subtract(clipped,owner)
    layers[tip]=(clipped,pivot,axis);give_boot_pixels(ImageChops.subtract(mask,clipped))
   donors={}
   for limb in description['arms']:
    donor=limb.get('donorRecommendation')
    if not donor:continue
    original=author['facings'][donor['facingIndex']]['actors'][0]
    hand=next(a for a in original['arms']if a['name']==donor['arm'])
    donor_mask=ImageChops.darker(capsule(master.size,hand['hand'],hand['hand'],hand['palmRadius']),polygon(master.size,hand['sourcePolygon']))
    image=masked(master,donor_mask);bbox=image.getbbox();image=image.crop(bbox)
    pivot=[(hand['hand'][0]-bbox[0])*donor['scale'],(hand['hand'][1]-bbox[1])*donor['scale']]
    image=image.resize((round(image.width*donor['scale']),round(image.height*donor['scale'])),Image.Resampling.LANCZOS)
    donors[limb['name']+'Hand']=(image,pivot,donor)
   for leg in description['legs']:
    donor=leg.get('footDonor')
    if not donor:continue
    source=next(l for l in description['legs']if l['name']==donor['leg'])
    image=masked(pose,polygon(master.size,source['footPolygon']));bbox=image.getbbox();image=image.crop(bbox)
    pivot=[(source['ankle'][0]-bbox[0])*donor['scale'],(source['ankle'][1]-bbox[1])*donor['scale']]
    image=image.resize((round(image.width*donor['scale']),round(image.height*donor['scale'])),Image.Resampling.LANCZOS)
    donors[leg['name']+'Foot']=(image,pivot,donor)
   if foot_views:
    for leg in description['legs']:
     image=foot_views[leg['footAtlasIndex']];x0,y0,x1,y1=leg['footBox']
     image=image.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
     pivot=[leg['ankle'][0]-x0,leg['ankle'][1]-y0]
     donors[leg['name']+'Foot']=(image,pivot,{'master':author['footMaster'],'viewIndex':leg['footAtlasIndex']})
   if leg_views:
    for leg in description['legs']:
     source=leg_views[leg['legAtlasIndex']]
     for suffix,a,b,start,end in [('Thigh',leg['hip'],leg['knee'],0,.58),('Shin',leg['knee'],leg['ankle'],.42,1)]:
      length=math.dist(a,b);width=leg.get('clothWidth',24)
      image=source.crop((0,round(source.height*start),source.width,round(source.height*end)))
      image=image.resize((width,math.ceil(length)+6),Image.Resampling.LANCZOS)
      donors[leg['name']+suffix]=(image,[width/2,3],{'master':author['legMaster'],'viewIndex':leg['legAtlasIndex'],'axis':[0,length]})
   if appendage_views:
    for extra in description['extras']:
     if 'atlasIndex'not in extra:continue
     image=appendage_views[extra['atlasIndex']];x0,y0,x1,y1=extra['replacementBox']
     image=image.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
     pivot=[extra['pivot'][0]-x0,extra['pivot'][1]-y0]
     donors[extra['name']]=(image,pivot,{'master':author['appendageMaster'],'viewIndex':extra['atlasIndex']})
   for extra in description['extras']:
    if not extra.get('sourceMaster'):continue
    donors[extra['name']]=reference_surface(extra)
   for family,suffixes in [('legs',{'upper':'Thigh','lower':'Shin','tip':'Foot'}),('arms',{'upper':'UpperArm','lower':'Forearm','tip':'Hand'})]:
    for limb in description[family]:
     for segment,surface in limb.get('surfaceDonors',{}).items():donors[limb['name']+suffixes[segment]]=reference_surface(surface,segment in['upper','lower'])
   if description.get('bodySources'):donors['body']=reference_surfaces(description['bodySources'])
   elif description.get('bodySource'):donors['body']=reference_surface(description['bodySource'])
   complete_head=None
   for name,(mask,pivot,axis)in layers.items():
    masks[name]=mask;combined_mask=ImageChops.lighter(combined_mask,mask)
    image=masked(pose,mask);url=f'{prefix}/{facing}-{actor["id"]}-{name}.webp'
    if name=='head'and actor_heads:
     source=actor_heads[description.get('headAtlasIndex',entry.get('headAtlasIndex',index))];box=image.getbbox()
     factor=math.sqrt((box[2]-box[0])*(box[3]-box[1])/(source.width*source.height))
     source=source.resize((round(source.width*factor),round(source.height*factor)),Image.Resampling.LANCZOS)
     canvas=Image.new('RGBA',master.size);canvas.alpha_composite(source,(round((box[0]+box[2]-source.width)/2),box[3]-source.height));image=canvas
     complete_head=image.copy()
    if name=='body'and torso_views:
     torso=torso_views[entry.get('torsoViewIndex',index)];torso=torso.crop((0,round(torso.height*author.get('cleanTorsoCropTopFraction',.16)),torso.width,torso.height))
     x0,y0,x1,y1=description['cleanBodyBounds'];torso=torso.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
     canvas=Image.new('RGBA',master.size);canvas.alpha_composite(torso,(x0,y0))
     # Preserve the original black shoulder strap as a separate visible
     # surface. Erosion excludes the old torso outline and arm boundaries.
     known=Image.new('L',master.size)
     for path in description.get('strapPaths',[]):
      for a,b in zip(path,path[1:]):known=ImageChops.lighter(known,capsule(master.size,a,b,10))
     rgba=np.array(pose);dark=(rgba[:,:,:3].max(2)<125)&(np.asarray(known)>0)
     strap=pose.copy();strap.putalpha(Image.fromarray(np.where(dark,rgba[:,:,3],0).astype(np.uint8)));canvas.alpha_composite(strap);image=canvas
    if name in donors:image,pivot,donor=donors[name];axis=donor.get('axis',axis)
    packed,info=register_part(image,pivot,density,url,axis);packed.save(ROOT/'public/modern'/url,lossless=True,method=6)
    if name in donors:info['donor']=donors[name][2]
    if name=='body'and torso_views:info['reconstructedFrom']=author['cleanTorsoMaster']
    if name=='head'and actor_heads:info['reconstructedFrom']=head_master
    if name in donors and 'master'in donors[name][2]:info['reconstructedFrom']=donors[name][2]['master']
    actor['parts'][name]=info;runtime.append({'url':url,'source':url,'pixelSize':list(packed.size),'pixelDensity':density,'sha256':hashlib.sha256((ROOT/'public/modern'/url).read_bytes()).hexdigest()})
   for extra in description['extras']:
    for expression,surface in extra.get('expressionSources',{}).items():
     image,pivot,donor=reference_surface(surface);name=extra['name']+'-'+expression;url=f'{prefix}/{facing}-{actor["id"]}-{name}.webp'
     packed,info=register_part(image,pivot,density,url);info['reconstructedFrom']=surface['sourceMaster'];packed.save(ROOT/'public/modern'/url,lossless=True,method=6)
     actor['parts'][name]=info;runtime.append({'url':url,'source':url,'pixelSize':list(packed.size),'pixelDensity':density,'sha256':hashlib.sha256((ROOT/'public/modern'/url).read_bytes()).hexdigest()})
   headmask=layers['head'][0]
   canonical=complete_head if complete_head is not None else masked(pose,headmask);headbox=canonical.getbbox();neck=joints['neck']
   champion_index=description.get('championHeadAtlasIndex',entry.get('championHeadAtlasIndex'))
   if actor_heads and champion_index is not None:
    image=actor_heads[champion_index]
    factor=math.sqrt((headbox[2]-headbox[0])*(headbox[3]-headbox[1])/(image.width*image.height))
    image=image.resize((round(image.width*factor),round(image.height*factor)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',master.size);canvas.alpha_composite(image,(round((headbox[0]+headbox[2]-image.width)/2),headbox[3]-image.height))
    url=f'{prefix}/{facing}-{actor["id"]}-head-champion.webp';packed,info=register_part(canvas,neck,density,url)
    info['reconstructedFrom']=head_master;actor['parts']['head-champion']=info;packed.save(ROOT/'public/modern'/url,lossless=True,method=6)
    runtime.append({'url':url,'source':url,'pixelSize':list(packed.size),'pixelDensity':density,'sha256':hashlib.sha256((ROOT/'public/modern'/url).read_bytes()).hexdigest()})
   if actor_expressions:
    happy=actor_expressions[index]
    factor=math.sqrt((headbox[2]-headbox[0])/happy.width*(headbox[3]-headbox[1])/(neck_rows[0][index]+3))
   for row,expression in enumerate(['happy','sad','hurt']if actor_expressions else[]):
    # Register expression sheets at their anatomical neck. All expressions in
    # a facing share one scale; extra burnt wisps do not shrink the face.
    image=actor_expressions[row*4+index];base=neck_base(image)
    neck_row=neck_rows[row][index]
    image=image.crop((0,0,image.width,neck_row+3))
    image=image.resize((round(image.width*factor),round(image.height*factor)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',master.size)
    at=(round(neck[0]-base[0]*factor),round(headbox[3]-neck_row*factor))
    if author.get('expressionAnchorMode')=='canonical-bounds':
     # A bob's lowest alpha belongs to a side lock, not its neck. Preserve the
     # canonical neck's offset within the whole head instead of following it.
     at=(round((headbox[0]+headbox[2]-image.width)/2),round(headbox[3]-image.height))
    canvas.alpha_composite(image,at)
    if expression!='hurt'and facing=='up-left':canvas=canonical.copy()
    name='head-'+expression;url=f'{prefix}/{facing}-{actor["id"]}-{name}.webp'
    packed,info=register_part(canvas,neck,density,url)
    if expression=='hurt'or facing!='up-left':info['sourceScale']=factor
    packed.save(ROOT/'public/modern'/url,lossless=True,method=6);actor['parts'][name]=info
    runtime.append({'url':url,'source':url,'pixelSize':list(packed.size),'pixelDensity':density,'sha256':hashlib.sha256((ROOT/'public/modern'/url).read_bytes()).hexdigest()})
   actor_origin=description.get('origin',origin)
   actor['joints']={name:[(p[0]-actor_origin[0])/density,(p[1]-actor_origin[1])/density]for name,p in joints.items()}
   arm_order=lambda front,over_head_arm=False:[part for spec,limb in zip(description['arms'],actor['arms'])if spec.get('overHead',False)==over_head_arm and(over_head_arm or spec.get('front',False)==front)for part in [limb['upper'],limb['lower'],limb['tip']]if part in actor['parts']]
   front_extras={e['name']for e in description['extras']if e.get('front',False)or e.get('overHead',False)}
   over_head={e['name']for e in description['extras']if e.get('overHead',False)}
   under_hand={e['name']for e in description['extras']if e.get('underHand',False)}
   front_flippers=[e['part']for e in actor['appendages']if e['kind']=='flipper'and e['part']in front_extras and e['part']not in over_head]
   actor['order']=[part for limb in actor['legs']for part in [limb['upper'],limb['lower'],limb['tip']]]+[e['part']for e in actor['appendages']if e['kind']!='fixed'and e['part']not in front_extras and e['part']not in under_hand]+arm_order(False)+['body']+[e['part']for e in actor['appendages']if e['part']in under_hand]+arm_order(True)+front_flippers+['head','head-expression']+arm_order(False,True)+[e['part']for e in actor['appendages']if(e['kind']=='fixed'or(e['part']in front_extras and e['part']not in front_flippers))and e['part']not in under_hand]
   actors.append(actor)
  pose=source_pose
  original_alpha=np.asarray(pose.getchannel('A'));retained=np.asarray(combined_mask)>0
  missing=int(np.count_nonzero((original_alpha>128)&~retained));total=int(np.count_nonzero(original_alpha>128))
  diagnostic=pose.copy();diagnostic.putalpha(Image.fromarray(np.where(retained,0,original_alpha).astype(np.uint8)));diagnostic.save(REVIEW/f'{stem}-{facing}-unassigned.png')
  coverage.append({'facing':facing,'assignedFraction':1-missing/max(1,total),'missingPixels':missing})
  rig['facings'][facing]={'actors':actors,**({'readyActorId':entry['readyActorId']}if 'readyActorId'in entry else{}),'shadow':{'x':0,'y':0,'width':37,'height':12}}
 result={'version':1,'status':'candidate-awaiting-user-review','activeIds':[cid],'deferredIds':[i for i in range(2,13)if i!=cid],'characters':[rig],'runtimeImages':runtime,'coverage':coverage,'generationAllowedIds':author.get('generationAllowedIds',[2])}
 (ROOT/'src/modern/data'/author.get('dataFile','characters-25.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 (REVIEW/f'{stem}-rig.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 return result

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--role',type=int,required=True,choices=[2,3,4,5,7,8,9,11,6,10,12]);parser.add_argument('--author');args=parser.parse_args()
 author=json.loads((REVIEW/(args.author or f'role-{args.role:02d}-authoring.json')).read_text())
 if author['id']!=args.role:raise ValueError('authoring identity must match the selected role')
 result=build_role(author)
 print(json.dumps({'activeIds':result['activeIds'],'coverage':result['coverage'],'textures':len(result['runtimeImages'])},ensure_ascii=False))
