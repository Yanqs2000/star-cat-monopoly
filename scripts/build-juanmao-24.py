#!/usr/bin/env python3
"""Build immutable RGBA puppet layers from one fixed, generated four-view master.
No original game files are overwritten. Animation is driven by continuous joint transforms.
"""
import json, math, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'public/hd-review/character-24'
OUT = ROOT / 'public/modern/hd-characters/juanmao-24'
DENSITY = 6.0
FACINGS = ['down-right', 'down-left', 'up-left', 'up-right']
# Author-marked joints on the same full-body neutral A-pose source; units are master pixels.
JOINTS = [
 dict(origin=[260,740],neck=[260,562],spine=[260,615],leftShoulder=[210,575],leftElbow=[183,601],leftHand=[154,633],rightShoulder=[322,570],rightElbow=[342,589],rightHand=[366,616],leftHip=[232,638],leftKnee=[218,666],leftAnkle=[211,692],rightHip=[287,637],rightKnee=[304,661],rightAnkle=[323,685]),
 dict(origin=[215,740],neck=[211,562],spine=[211,615],leftShoulder=[137,570],leftElbow=[119,590],leftHand=[105,617],rightShoulder=[264,574],rightElbow=[282,605],rightHand=[306,634],leftHip=[180,638],leftKnee=[161,663],leftAnkle=[151,688],rightHip=[239,640],rightKnee=[250,668],rightAnkle=[258,703]),
 dict(origin=[225,740],neck=[222,545],spine=[225,615],leftShoulder=[171,558],leftElbow=[144,591],leftHand=[116,635],rightShoulder=[302,568],rightElbow=[329,590],rightHand=[359,619],leftHip=[191,638],leftKnee=[179,666],leftAnkle=[172,702],rightHip=[256,638],rightKnee=[273,666],rightAnkle=[289,695]),
 dict(origin=[260,740],neck=[260,550],spine=[260,614],leftShoulder=[201,560],leftElbow=[175,591],leftHand=[152,611],rightShoulder=[298,566],rightElbow=[319,600],rightHand=[342,634],leftHip=[238,636],leftKnee=[224,666],leftAnkle=[208,696],rightHip=[289,639],rightKnee=[301,668],rightAnkle=[317,703]),
]
HEAD_POLYS = [
 [(0,0),(444,0),(444,538),(415,541),(394,536),(361,553),(319,566),(253,573),(200,568),(170,558),(139,530),(0,530)],
 [(0,0),(444,0),(444,531),(345,532),(301,558),(267,569),(199,573),(145,563),(104,550),(75,526),(0,526)],
 [(0,0),(444,0),(444,535),(350,538),(350,655),(291,653),(287,547),(226,552),(157,549),(100,537),(0,537)],
 [(0,0),(444,0),(444,542),(380,551),(331,565),(267,564),(199,553),(122,599),(62,599),(40,530),(0,530)],
]
FOOT_POLYS = [
 [ [(170,671),(230,668),(258,689),(257,742),(161,746),(161,703)], [(278,660),(329,660),(373,688),(369,731),(264,731),(265,686)] ],
 [ [(111,663),(167,661),(204,685),(204,731),(93,733),(92,694)], [(218,674),(272,677),(304,704),(304,746),(207,746),(207,700)] ],
 [ [(124,680),(186,677),(226,704),(225,746),(114,746),(113,706)], [(247,674),(291,676),(333,699),(333,738),(236,739),(236,697)] ],
 [ [(173,673),(224,672),(251,694),(249,735),(153,736),(152,700)], [(272,677),(323,676),(365,703),(362,746),(251,746),(251,696)] ],
]
TORSO_POLYS = [
 [(209,552),(303,552),(327,584),(322,630),(293,651),(228,650),(190,628),(187,586)],
 [(143,550),(250,550),(276,589),(271,633),(242,653),(178,649),(140,627),(132,584)],
 [(183,540),(270,540),(299,580),(290,631),(257,650),(188,646),(151,613),(153,573)],
 [(205,547),(291,547),(316,586),(310,632),(290,651),(228,650),(189,631),(188,582)],
]

def cleaned(im):
    # Remove isolated low-alpha generation specks, preserving smooth alpha on the main silhouette.
    a=np.array(im.getchannel('A')); solid=a>100
    from collections import deque
    seen=np.zeros_like(solid,dtype=bool);best=[]
    for y,x in zip(*np.where(solid & ~seen)):
        if seen[y,x]:continue
        q=deque([(int(y),int(x))]);seen[y,x]=1;points=[]
        while q:
            yy,xx=q.popleft();points.append((yy,xx))
            for ny,nx in ((yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)):
                if 0<=ny<a.shape[0] and 0<=nx<a.shape[1] and solid[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
        if len(points)>len(best):best=points
    keep=Image.new('L',im.size);arr=np.zeros_like(a)
    for y,x in best:arr[y,x]=255
    from PIL import ImageFilter
    keep=Image.fromarray(arr).filter(ImageFilter.MaxFilter(3))
    result=im.copy();result.putalpha(ImageChops.multiply(im.getchannel('A'),keep));return result

def polygon_mask(size,points):
    m=Image.new('L',size);ImageDraw.Draw(m).polygon(points,fill=255);return m

def capsule(size,a,b,r):
    m=Image.new('L',size);d=ImageDraw.Draw(m);d.line([tuple(a),tuple(b)],fill=255,width=round(r*2))
    for x,y in [a,b]:d.ellipse((x-r,y-r,x+r,y+r),fill=255)
    return m

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    master_path=REVIEW/'juanmao-four-view-master-r1.png'
    master=Image.open(master_path).convert('RGBA')
    width=master.width/4
    expressions={}
    for name in ['happy','sad','hurt']:
        p=REVIEW/f'juanmao-{name}-master-r1.png'
        if p.exists():expressions[name]=Image.open(p).convert('RGBA').resize(master.size)
    data={'version':1,'status':'candidate-awaiting-user-review','characterId':1,'density':DENSITY,'mapAnchor':[28,20],'sourceSha256':hashlib.sha256(master_path.read_bytes()).hexdigest(),'originalSwfSha256':hashlib.sha256((ROOT/'public/original/star1.swf').read_bytes()).hexdigest(),'method':'fixed 2D cutout layers, two-bone IK, continuous transforms; newly authored motion, original durations','facings':{}}
    contact=Image.new('RGBA',(master.width,master.height))
    for i,facing in enumerate(FACINGS):
        cell=cleaned(master.crop((round(i*width),0,round((i+1)*width),master.height)))
        joints=JOINTS[i];origin=joints['origin'];parts={}
        def add(name,mask,pivot,end=None,src=cell):
            im=src.copy();im.putalpha(ImageChops.multiply(im.getchannel('A'),mask));bbox=im.getbbox()
            if not bbox:raise ValueError(name)
            im=im.crop(bbox);p=OUT/f'{facing}-{name}.png';im.save(p)
            item={'url':f'hd-characters/juanmao-24/{p.name}','width':im.width,'height':im.height,'pivot':[(pivot[0]-bbox[0])/DENSITY,(pivot[1]-bbox[1])/DENSITY]}
            if end:item['axis']=[(end[0]-pivot[0])/DENSITY,(end[1]-pivot[1])/DENSITY]
            parts[name]=item
        head=polygon_mask(cell.size,HEAD_POLYS[i]);torso=polygon_mask(cell.size,TORSO_POLYS[i])
        add('body',torso,joints['spine'])
        add('head',head,joints['neck'])
        eye_regions=[[(231,447,303,533),(350,437,400,514)],[(52,435,102,515),(137,448,210,537)],[],[(375,435,426,524)]][i]
        if eye_regions:
            eye_mask=Image.new('L',cell.size);eye_draw=ImageDraw.Draw(eye_mask)
            for box in eye_regions:eye_draw.ellipse(box,fill=255)
            rgb=np.array(cell)[:,:,:3].astype(float)
            whiteness=np.minimum(np.clip((rgb.min(axis=2)-120)/70,0,1),np.clip((45-(rgb.max(axis=2)-rgb.min(axis=2)))/20,0,1))
            eye_mask=ImageChops.multiply(eye_mask,Image.fromarray((whiteness*255).astype('uint8')))
            add('head-eyes',eye_mask,joints['neck'])
        for expression,expr_master in expressions.items():
            expr_cell=cleaned(expr_master.crop((round(i*width),0,round((i+1)*width),master.height)))
            add(f'head-{expression}',head,joints['neck'],src=expr_cell)
        for side in ['left','right']:
            s,e,h=[joints[side+x] for x in ['Shoulder','Elbow','Hand']]
            hip,knee,ankle=[joints[side+x] for x in ['Hip','Knee','Ankle']]
            # Source-aligned overlaps preserve round joints when the limbs rotate.
            upper=capsule(cell.size,s,e,17);upper=ImageChops.subtract(upper,head)
            forearm=Image.new('L',cell.size)
            ImageDraw.Draw(forearm).ellipse((h[0]-27,h[1]-24,h[0]+27,h[1]+24),fill=255);forearm=ImageChops.subtract(forearm,head)
            thigh=capsule(cell.size,hip,knee,24)
            shin=capsule(cell.size,knee,ankle,23)
            foot=polygon_mask(cell.size,FOOT_POLYS[i][0 if side=='left' else 1])
            # Restrict each boot to its own side to keep the neighbouring shoe out.
            mid=(joints['leftAnkle'][0]+joints['rightAnkle'][0])/2
            side_mask=polygon_mask(cell.size,[(0 if side=='left' else mid,0),(mid if side=='left' else cell.width,0),(mid if side=='left' else cell.width,887),(0 if side=='left' else mid,887)])
            foot=ImageChops.multiply(foot,side_mask)
            add(side+'UpperArm',upper,s,e);add(side+'Forearm',forearm,e,h)
            thigh=ImageChops.subtract(ImageChops.multiply(thigh,side_mask),foot)
            shin=ImageChops.subtract(ImageChops.multiply(shin,side_mask),foot)
            add(side+'Thigh',thigh,hip,knee);add(side+'Shin',shin,knee,ankle);add(side+'Foot',foot,ankle)
        data['facings'][facing]={'joints':{name:[(p[0]-origin[0])/DENSITY,(p[1]-origin[1])/DENSITY] for name,p in joints.items() if name!='origin'},'parts':parts}
        contact.alpha_composite(cell,(round(i*width),0))
    data['masters']=[{'path':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pixelSize':list(Image.open(p).size)}for p in [master_path,*[REVIEW/f'juanmao-{name}-master-r1.png'for name in expressions]]]
    for facing in data['facings'].values():
        for part in facing['parts'].values():part['sha256']=hashlib.sha256((ROOT/'public/modern'/part['url']).read_bytes()).hexdigest()
    contact.save(REVIEW/'cleaned-neutral-four-view.png')
    (ROOT/'src/modern/data/juanmao-24.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    (REVIEW/'rig-manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'facings':len(data['facings']),'parts':sum(len(f['parts']) for f in data['facings'].values()),'status':data['status']}))
if __name__=='__main__':build()
