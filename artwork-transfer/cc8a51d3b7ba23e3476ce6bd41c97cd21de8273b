"""Build the full 2x WebP profile from original assets and 2x SWF renders."""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib, importlib.util, json, math, os, shutil, subprocess, sys, threading
from pathlib import Path
from PIL import Image, features

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public/modern/assets'; DEST=ROOT/'public/modern/assets-hd'
CACHE=ROOT/'.analysis-cache/hd-assets-5b'
ORIGINAL=ROOT/'public/original'; HD_SOURCE=ROOT/'public/hd-assets'
FFDEC=Path(os.environ.get('FFDEC_ROOT',ROOT/'.analysis-tools/ffdec-26.2.1/full')).resolve()
JAVA=os.environ.get('FFDEC_JAVA',shutil.which('java') or '')
DENSITY=2
CHARS=[(1,'juanmao','juanmao-hd-v2.png'),(2,'aniu','aniu.png'),(3,'jijimimi','jijimimi.png'),
 (4,'jiajia','jiajia.png'),(5,'dapai','dapai.png'),(6,'weiwei','weiwei.png'),(7,'shuaige','shuaige.png'),
 (8,'dawei','dawei.png'),(9,'afei','afei.png'),(10,'ajie','ajie.png'),(11,'guaika','guaika.png'),
 (12,'nini','nini.png')]
BUILDING_CANDIDATES=[
 ('building',178,2),('building-181',181,4),('building-190',190,6),('building-187',187,5),
 ('building-196',196,8),('building-199',199,10),('building-193',193,9),('building-205',205,11),
 ('building-202',202,7),('building-208',208,12),('building-211',211,3),
]
ENTRIES={}; LOCK=threading.Lock()
def need(ok,msg):
    if not ok: raise SystemExit(msg)
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(131072),b''):h.update(b)
    return h.hexdigest()
def jdk(name):
    p=Path(JAVA).expanduser()
    if p.is_absolute() and p.name=='java' and p.with_name(name).is_file(): return str(p.with_name(name))
    found=shutil.which(name)
    if found:return found
    raise SystemExit(f'JDK binary missing: {name}')
def run(args,log):
    r=subprocess.run(args,cwd=ROOT,text=True,capture_output=True)
    log.parent.mkdir(parents=True,exist_ok=True);log.write_text(r.stdout+r.stderr)
    if r.returncode: raise SystemExit(f'Exporter failed; see {log.relative_to(ROOT)}')
    return r.stdout
def profile_pixels(source,already_density=False,expected_size=None):
    source.load()
    if already_density:
        hd=source.convert('RGBA')
    else:
        width,height=source.size
        hd=source.convert('RGBA').convert('RGBa').resize((width*2,height*2),Image.Resampling.LANCZOS).convert('RGBA')
    if expected_size is not None:
        need(hd.size==expected_size,f'Unexpected HD pixel size: {hd.size} != {expected_size}')
    return hd
def convert(src,dest,group,already_density=False,expected_size=None):
    dest.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(src) as im:
        im.load(); width,height=im.size
        source_alpha=im.convert('RGBA').getchannel('A')
        source_has_transparency=source_alpha.getextrema()[0]<255
        hd=profile_pixels(im,already_density,expected_size)
        expected_alpha_sha256=hashlib.sha256(hd.getchannel('A').tobytes()).hexdigest()
        hd.save(dest,format='WEBP',lossless=False,quality=98,method=4,alpha_quality=100)
    e={'path':dest.relative_to(ROOT/'public/modern').as_posix(),
       'source':src.relative_to(ROOT).as_posix(),'sourceSha256':digest(src),
       'outputSha256':digest(dest),
       'expectedAlphaSha256':expected_alpha_sha256,'sourceHasTransparency':source_has_transparency,
       'sourceSize':[width,height],'pixelSize':list(hd.size),
       'pixelDensity':2,'sourcePixelDensity':2 if already_density else 1,
       'group':group,'encoding':'WebP q98, alpha quality 100',
       'method':'JPEXS 2x render' if already_density else 'Lanczos premultiplied-alpha resize to 2x'}
    with LOCK:ENTRIES[e['path']]=e
    return e
def vector_convert(src,rel,group,logical_size,source_path,source_hash,metadata,method):
    pixel_size=(logical_size[0]*DENSITY,logical_size[1]*DENSITY)
    target=DEST/rel.with_suffix('.webp')
    entry=convert(src,target,group,already_density=True,expected_size=pixel_size)
    entry.update({'source':source_path,'sourceSha256':source_hash,'logicalSize':list(logical_size),
                  'sourcePixelDensity':2,'method':method,**metadata})
    with LOCK:ENTRIES[entry['path']]=entry
    return entry
def fit_transparent_canvas(src,dest,logical_size):
    expected=(logical_size[0]*DENSITY,logical_size[1]*DENSITY)
    with Image.open(src) as image:
        image.load();need(image.mode=='RGBA',f'Expected RGBA vector render: {src}')
        actual=image.size
        need(actual[0]<=expected[0] and actual[1]<=expected[1]
             and expected[0]-actual[0]<=1 and expected[1]-actual[1]<=1,
             f'2x render exceeds or differs from logical canvas: {src} {actual} != {expected}')
        canvas=Image.new('RGBA',expected,(0,0,0,0));canvas.alpha_composite(image,(0,0))
        dest.parent.mkdir(parents=True,exist_ok=True);canvas.save(dest)
    return {'nativeRenderSize':list(actual),'fitPaddingPx':[expected[0]-actual[0],expected[1]-actual[1]]}
def rel_from_asset_url(url):
    need(isinstance(url,str) and url.startswith('assets/'),f'Invalid source asset URL: {url}')
    return Path(url.removeprefix('assets/'))
def mirror_sources():
    pngs=sorted(p for p in SOURCE.rglob('*.png') if not is_timeline_frame(p.relative_to(SOURCE)))
    need(len(pngs)>1000,'Original PNG inventory unexpectedly small')
    for j,src in enumerate(pngs):
        rel=src.relative_to(SOURCE).with_suffix('.webp')
        group=Path(src.relative_to(SOURCE).parts[0]).stem
        yield src,DEST/rel,group
def is_timeline_frame(rel):
    parts=rel.parts
    return parts[0]=='walk' or (len(parts)>2 and parts[0]=='characters' and parts[2] in {'walk','reactions'})
def main():
    need(features.check('webp'),'Pillow WebP support is required')
    need(JAVA!='','Set FFDEC_JAVA to a JDK')
    need((FFDEC/'lib/ffdec_lib.jar').is_file(),'Pinned JPEXS 26.2.1 library missing')
    need(SOURCE.is_dir(),'Modern original asset bundle missing')
    if DEST.exists():
        owned=(DEST/'hd-manifest.json').is_file() or (DEST/'.hd-build-in-progress').is_file()
        need(owned,'Refusing to replace an unowned assets-hd directory')
        shutil.rmtree(DEST)
    if CACHE.exists():shutil.rmtree(CACHE)
    DEST.mkdir(parents=True);(DEST/'.hd-build-in-progress').write_text('owned by build-modern-hd-assets.py\n');CACHE.mkdir(parents=True)
    pngs=sorted(SOURCE.rglob('*.png'));jobs=list(mirror_sources())
    workers=max(2,min(6,(os.cpu_count() or 4)-1));done=0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures=[pool.submit(convert,src,target,group) for src,target,group in jobs]
        for f in as_completed(futures):
            f.result();done+=1
            if done%500==0:print(f'HD image profile: {done}/{len(jobs)}',flush=True)
    for src in SOURCE.rglob('*.json'):
        target=DEST/src.relative_to(SOURCE);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,target)
    original=json.loads((ORIGINAL/'manifest.json').read_text())
    hashes={f'star{i}.swf':next(x['sha256'] for x in original['files'] if x['name']==f'star{i}.swf') for i in range(1,13)}
    spec=importlib.util.spec_from_file_location('hd_assets',ROOT/'scripts/hd_assets.py')
    need(spec is not None and spec.loader is not None,'Existing original-art patcher missing')
    patcher=importlib.util.module_from_spec(spec);spec.loader.exec_module(patcher)
    classes=CACHE/'classes';classes.mkdir()
    cp=str(FFDEC/'lib'/'*')
    java_sources=[ROOT/'scripts'/name for name in ['ExportModernWalkAssets.java','ExportReactionAssets.java',
        'ExportCompanyAssets.java','ExportPropertyAssets.java','ExportWorldAssets.java','ExportInteractionAssets.java',
        'ExportActivityAssets.java']]
    run([jdk('javac'),'-classpath',cp,'-d',str(classes),*[str(path) for path in java_sources]],CACHE/'javac.log')
    cp=f'{classes}:{cp}';char_reports=[]
    character_index=json.loads((SOURCE/'characters/index.json').read_text())
    character_manifest_paths={item['id']:Path(item['manifestUrl'].removeprefix('assets/'))
                              for item in character_index['characters']}
    for cid,key,candidate in CHARS:
        swf=ORIGINAL/f'star{cid}.swf';need(digest(swf)==hashes[f'star{cid}.swf'],f'Original star{cid} changed')
        art=ROOT/'public/hd-review'/candidate if cid==1 else HD_SOURCE/candidate
        need(art.is_file(),f'Missing high-resolution base art: {art}')
        original_walk=json.loads((SOURCE/character_manifest_paths[cid]).read_text())
        original_reactions=json.loads((SOURCE/'characters'/str(cid)/'reactions'/'manifest.json').read_text())
        staging=CACHE/'candidates'/str(cid);staging.mkdir(parents=True,exist_ok=True);shutil.copyfile(art,staging/(key+'.png'))
        patcher.OUTPUT=staging;patcher.REVIEW=ROOT/'public/hd-review'
        patched=CACHE/'swf'/f'star{cid}-hd.swf';patched.parent.mkdir(parents=True,exist_ok=True)
        patch=patcher.patch_swf(swf,patched,[{'key':key,'tag':1,'swf':f'star{cid}.swf',
             'originalFile':f'{key}-original.jpg','type':'character'}])
        walk_rel=Path('walk') if cid==1 else Path('characters')/str(cid)/'walk'
        walk_tmp=CACHE/'export'/str(cid)/'walk';walk_tmp.parent.mkdir(parents=True,exist_ok=True)
        walk=json.loads(run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-classpath',cp,
             'ExportModernWalkAssets',str(patched),str(walk_tmp),str(CACHE/'scratch'/str(cid)/'walk'),'2'],
             CACHE/'logs'/f'star{cid}-walk.log'))
        need(len(walk['clips'])==4 and walk['pixelDensity']==2,f'Walk source manifest invalid for {key}')
        for clip in walk['clips']:
            x0,x1,y0,y1=clip['sourceBoundsTwips'];size=(math.ceil((x1-x0)*2/20),math.ceil((y1-y0)*2/20))
            source_clip=next(item for item in original_walk['clips'] if item['facing']==clip['facing'])
            for n in range(1,clip['frameCount']+1):
                src=walk_tmp/clip['facing']/f'{n}.png'
                with Image.open(src) as im: need(im.size==size and im.mode=='RGBA',f'Invalid HD walk frame {src}')
                target=DEST/walk_rel/clip['facing']/f'{n}.webp'
                e=convert(src,target,'characters',already_density=True,expected_size=size)
                e.update({'source':f'public/original/star{cid}.swf','sourceSha256':hashes[f'star{cid}.swf'],
                       'characterId':cid,'facing':clip['facing'],'action':'walk','sourceFrame':n,
                       'sourceSpriteId':source_clip['sourceSpriteId'],'sourceBoundsTwips':source_clip['sourceBoundsTwips'],
                       'fps':30,'durationMs':source_clip['frames'][n-1]['durationMs'],
                       'logicalAnchor':[source_clip['frames'][n-1]['offsetX'],source_clip['frames'][n-1]['offsetY']],
                       'renderSwfSha256':digest(patched),'method':'original timeline + selected HD base art'})
        reaction_tmp=CACHE/'export'/str(cid)/'reactions';reaction_tmp.mkdir(parents=True,exist_ok=True)
        reactions=json.loads(run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
             '-classpath',cp,'ExportReactionAssets',str(patched),str(reaction_tmp),
             str(CACHE/'scratch'/str(cid)/'reactions'),str(cid)],CACHE/'logs'/f'star{cid}-reaction.log'))
        need(len(reactions['clips'])==20 and len(reactions['godOverlays'])==6,f'Reaction source manifest invalid for {key}')
        reaction_rel=Path('characters')/str(cid)/'reactions'
        for clip in reactions['clips']:
            x0,x1,y0,y1=clip['renderBoundsTwips'];size=(math.ceil((x1-x0)*2/20),math.ceil((y1-y0)*2/20))
            source_clip=next((item for item in original_reactions['clips']
                              if item['name']==clip['name'] and item['facing']==clip['facing']),None)
            need(source_clip is not None and len(source_clip['frames'])==clip['frames'],
                 f'Original action timing manifest mismatch for {key}/{clip["name"]}/{clip["facing"]}')
            for n in range(1,clip['frames']+1):
                src=reaction_tmp/clip['name']/clip['facing']/f'{n}.png'
                with Image.open(src) as im: need(im.size==size and im.mode=='RGBA',f'Invalid HD action frame {src}')
                target=DEST/reaction_rel/clip['name']/clip['facing']/f'{n}.webp'
                e=convert(src,target,'characters',already_density=True,expected_size=size)
                e.update({'source':f'public/original/star{cid}.swf','sourceSha256':hashes[f'star{cid}.swf'],
                       'characterId':cid,'facing':clip['facing'],'action':clip['name'],'sourceFrame':n,
                       'logicalSize':[source_clip['frames'][n-1]['width'],source_clip['frames'][n-1]['height']],
                       'logicalAnchor':[source_clip['frames'][n-1]['offsetX'],source_clip['frames'][n-1]['offsetY']],
                       'fps':source_clip['fps'],'loop':source_clip['loop'],'durationMs':1000/source_clip['fps'],
                       'renderSwfSha256':digest(patched),'method':'original timeline + selected HD base art'})
        for overlay in reactions['godOverlays']:
            n=overlay['godId'];src=reaction_tmp/'gods'/f'{n}.png';x0,x1,y0,y1=overlay['renderBoundsTwips']
            size=(math.ceil((x1-x0)*2/20),math.ceil((y1-y0)*2/20))
            with Image.open(src) as im: need(im.size==size and im.mode=='RGBA',f'Invalid HD god overlay {src}')
            source_overlay=next(item for item in original_reactions['godOverlays'] if item['godId']==n)
            target=DEST/reaction_rel/'gods'/f'{n}.webp';e=convert(src,target,'characters',already_density=True,expected_size=size)
            e.update({'source':f'public/original/star{cid}.swf','sourceSha256':hashes[f'star{cid}.swf'],
                      'characterId':cid,'godId':n,'logicalSize':[source_overlay['width'],source_overlay['height']],
                      'logicalAnchor':[source_overlay['offsetX'],source_overlay['offsetY']],
                      'renderSwfSha256':digest(patched),
                      'method':'original timeline overlay + selected HD base art'})
        cheer_tmp=CACHE/'export'/str(cid)/'cheer';cheer_tmp.mkdir(parents=True,exist_ok=True)
        cheer=json.loads(run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
             '-classpath',cp,'ExportReactionAssets',str(patched),str(cheer_tmp),
             str(CACHE/'scratch'/str(cid)/'cheer'),str(cid),'cheer'],CACHE/'logs'/f'star{cid}-cheer.log'))
        need(len(cheer['clips'])==4 and all(clip['name']=='cheer' for clip in cheer['clips']),
             f'Cheer action export incomplete for {key}')
        for clip in cheer['clips']:
            x0,x1,y0,y1=clip['renderBoundsTwips'];size=(math.ceil((x1-x0)*2/20),math.ceil((y1-y0)*2/20))
            source_clip=next((item for item in original_reactions['clips']
                              if item['name']=='cheer' and item['facing']==clip['facing']),None)
            need(source_clip is not None and len(source_clip['frames'])==clip['frames'],
                 f'Original cheer manifest mismatch for {key}/{clip["facing"]}')
            for n in range(1,clip['frames']+1):
                src=cheer_tmp/'cheer'/clip['facing']/f'{n}.png'
                with Image.open(src) as im:need(im.size==size and im.mode=='RGBA',f'Invalid cheer frame {src}')
                target=DEST/reaction_rel/'cheer'/clip['facing']/f'{n}.webp'
                e=convert(src,target,'characters',already_density=True,expected_size=size)
                e.update({'source':f'public/original/star{cid}.swf','sourceSha256':hashes[f'star{cid}.swf'],
                       'characterId':cid,'facing':clip['facing'],'action':'cheer','sourceFrame':n,
                       'logicalSize':[source_clip['frames'][n-1]['width'],source_clip['frames'][n-1]['height']],
                       'logicalAnchor':[source_clip['frames'][n-1]['offsetX'],source_clip['frames'][n-1]['offsetY']],
                       'fps':source_clip['fps'],'loop':source_clip['loop'],'durationMs':1000/source_clip['fps'],
                       'renderSwfSha256':digest(patched),'method':'original timeline + selected HD base art'})
        char_reports.append({'id':cid,'key':key,'sourceHash':hashes[f'star{cid}.swf'],
            'candidate':art.relative_to(ROOT).as_posix(),'candidateSha256':digest(art),
            'workSwfHash':digest(patched),'walk':walk,'reactions':reactions,'cheer':cheer})
        print(f'HD character timeline: {cid}/12 {key}',flush=True)
    play_swf=ORIGINAL/'play.swf';play_hash=digest(play_swf)
    need(play_hash==next(x['sha256'] for x in original['files'] if x['name']=='play.swf'),
         'Original play.swf hash changed')
    company_source=json.loads((SOURCE/'companies/manifest.json').read_text())
    candidate_root=CACHE/'building-candidates';candidate_root.mkdir(parents=True)
    patch_assets=[];candidate_reports=[]
    for key,bitmap_id,company_id in BUILDING_CANDIDATES:
        art=ROOT/'public/hd-review'/f'{key}-hd-candidate.png'
        original_file=f'{key}-original.jpg'
        need(art.is_file() and (ROOT/'public/hd-review'/original_file).is_file(),
             f'Missing selected company building candidate: {key}')
        rgba=patcher.remove_black_background(Image.open(art))
        alpha=rgba.getchannel('A');need(alpha.getextrema()==(0,255),f'Invalid extracted alpha edge: {key}')
        rgba.save(candidate_root/f'{key}.png')
        patch_assets.append({'key':key,'tag':bitmap_id,'swf':'play.swf','originalFile':original_file,'type':'building'})
        candidate_reports.append({'key':key,'companyId':company_id,'bitmapId':bitmap_id,
                                  'shapeId':bitmap_id+1,'source':art.relative_to(ROOT).as_posix(),
                                  'sourceSha256':digest(art),'transparentPixelCount':sum(1 for a in alpha.getdata() if a==0),
                                  'partialPixelCount':sum(1 for a in alpha.getdata() if 0<a<255)})
    patcher.OUTPUT=candidate_root;patcher.REVIEW=ROOT/'public/hd-review'
    company_swf=CACHE/'swf'/'play-companies-hd.swf';company_swf.parent.mkdir(parents=True,exist_ok=True)
    company_patch=patcher.patch_swf(play_swf,company_swf,patch_assets)
    expected_shapes=sorted(bitmap_id+1 for _,bitmap_id,_ in BUILDING_CANDIDATES)
    need(company_patch['shapeIds']==expected_shapes,'Selected building SWF shape patch coverage changed')
    company_out=CACHE/'vector'/'companies';company_out.mkdir(parents=True)
    company_meta=json.loads(run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
        '-classpath',cp,'ExportCompanyAssets',str(company_swf),str(company_out),str(CACHE/'scratch'/'companies')],
        CACHE/'logs'/'companies-2x.log'))
    need(company_meta.get('pixelDensity')==2 and company_meta.get('companySymbols')==[186,180,213,183,189,192,204,198,195,201,207,210],
         'Company 2x exporter metadata is invalid')
    candidate_for_company={row['companyId']:row for row in candidate_reports}
    for company in company_source['companies']:
        cid=company['characterId'];rel=rel_from_asset_url(company['url'])
        candidate=candidate_for_company.get(cid)
        extra={'companyId':cid,'sourceSymbol':company['sourceSpriteId'],'boundsTwips':company['boundsTwips'],
               'logicalAnchor':[company['offsetX'],company['offsetY']],
               'renderSwfSha256':digest(company_swf)}
        if candidate:extra.update({'candidate':candidate['source'],'candidateSha256':candidate['sourceSha256'],
                                   'bitmapId':candidate['bitmapId'],'shapeId':candidate['shapeId']})
        vector_convert(company_out/f'{cid}.png',rel,'companies',(company['width'],company['height']),
                       'public/original/play.swf',play_hash,extra,
                       'JPEXS 2x company sprite; selected high-resolution building candidates retain source shape bounds')
    print('HD company sprites: 12/12, including 11 selected building candidates',flush=True)

    property_source=json.loads((SOURCE/'properties/manifest.json').read_text())
    need(property_source.get('sourceSha256')==play_hash,'Property manifest source hash mismatch')
    property_out=CACHE/'vector'/'properties';property_out.mkdir(parents=True)
    property_meta=json.loads(run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
        '-classpath',cp,'ExportPropertyAssets',str(play_swf),str(property_out),str(CACHE/'scratch'/'properties')],
        CACHE/'logs'/'properties-2x.log'))
    for item in property_source['sellSigns']:
        rel=rel_from_asset_url(item['url']);source=SOURCE/rel
        with Image.open(source) as image:logical_size=image.size
        vector_convert(property_out/rel.relative_to('properties'),rel,'properties',logical_size,
                       'public/original/play.swf',play_hash,
                       {'sourceSymbol':839,'sourceFrame':item['facing'],'facing':item['facing'],
                        'logicalAnchor':[item['offsetX'],item['offsetY']],
                        'boundsTwips':[-8,1152,-515,745]},
                       'JPEXS 2x original sale-sign timeline render')
    for item in property_source['houses']:
        rel=rel_from_asset_url(item['url']);source=SOURCE/rel
        with Image.open(source) as image:logical_size=image.size
        vector_convert(property_out/rel.relative_to('properties'),rel,'properties',logical_size,
                       'public/original/play.swf',play_hash,
                       {'sourceSymbol':3401,'sourceFrame':(item['facing']-1)*10+item['level']+1,
                        'ownerId':item['ownerId'],'facing':item['facing'],'level':item['level'],
                        'logicalAnchor':[item['offsetX'],item['offsetY']],
                        'boundsTwips':[-360,1440,-1373,1107]},
                       'JPEXS 2x original residential timeline render')
    print('HD property sprites: 100/100 at 2x from original timelines',flush=True)

    world_source=json.loads((SOURCE/'world/manifest.json').read_text())
    need(world_source.get('sourceSha256')==play_hash,'World manifest source hash mismatch')
    world_raw=CACHE/'vector'/'world-raw';world_norm=CACHE/'vector'/'world-normalized'
    world_meta=json.loads(run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
        '-classpath',cp,'ExportWorldAssets',str(play_swf),str(world_raw),str(CACHE/'scratch'/'world')],
        CACHE/'logs'/'world-2x.log'))
    world_spec=importlib.util.spec_from_file_location('modern_hd_world_export',ROOT/'scripts/export-world-assets.py')
    need(world_spec is not None and world_spec.loader is not None,'World normalization helper missing')
    world_module=importlib.util.module_from_spec(world_spec);sys.modules[world_spec.name]=world_module
    world_spec.loader.exec_module(world_module)
    world_module.normalize_exports(world_raw,world_norm,world_meta,density=2)
    world_metadata={item['id']:item for item in world_meta['clips']}
    for clip in world_source['clips']:
        native=world_metadata[clip['id']]
        for frame_index,frame in enumerate(clip['frames'],start=1):
            rel=rel_from_asset_url(frame['url'])
            vector_rel=rel.relative_to('world')
            vector_convert(world_norm/vector_rel,rel,'world',(frame['width'],frame['height']),
                'public/original/play.swf',play_hash,
                {'sourceSymbol':clip['sourceSymbol'],'sourceFrame':frame_index,'fps':clip['fps'],'loop':clip['loop'],
                 'durationMs':1000/clip['fps'],'logicalAnchor':[frame['offsetX'],frame['offsetY']],
                 'targetBoundsTwips':native['targetBoundsTwips'],'renderBoundsTwips':native['renderBoundsTwips']},
                'JPEXS 2x original world timeline; embedded source bitmaps retain their native detail')
    for house in world_source['neutralHouses']:
        rel=rel_from_asset_url(house['url'])
        vector_convert(world_norm/rel.relative_to('world'),rel,'world',(house['width'],house['height']),
            'public/original/play.swf',play_hash,
            {'sourceSymbol':3401,'sourceFrame':house['sourceFrame'],'facing':house['facing'],'level':house['level'],
             'logicalAnchor':[house['offsetX'],house['offsetY']],
             'targetBoundsTwips':[-360,1440,-1373,1107]},
            'JPEXS 2x original neutral residential timeline render')
    print('HD world sprites: 810/810 at 2x with source bounds and logical anchors preserved',flush=True)

    interaction_source=json.loads((SOURCE/'interactions/manifest.json').read_text())
    need(interaction_source.get('sourceSha256')==play_hash,'Interaction manifest source hash mismatch')
    interaction_out=CACHE/'vector'/'interactions';interaction_out.mkdir(parents=True)
    interaction_meta=run([jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
        '-classpath',cp,'ExportInteractionAssets',str(play_swf),str(interaction_out),str(CACHE/'scratch'/'interactions')],
        CACHE/'logs'/'interactions-2x.log')
    for entry in [*interaction_source['cards'],*interaction_source['luck']]:
        rel=rel_from_asset_url(entry['url']);vector_rel=rel.relative_to('interactions')
        vector_convert(interaction_out/vector_rel,rel,'interactions',(entry['width'],entry['height']),
            'public/original/play.swf',play_hash,
            {'sourceSymbol':1721 if rel.parts[1]=='cards' else 1412,'sourceFrame':entry['sourceFrame'],
             'interactionId':entry['id'],'logicalAnchor':[entry['offsetX'],entry['offsetY']]},
            'JPEXS 2x original card or luck illustration frame')
    print('HD interaction sprites: 58/58 at 2x from original SWF frames',flush=True)

    activity_source=json.loads((SOURCE/'activities/manifest.json').read_text())
    need(activity_source.get('sourceSha256')==play_hash,'Activity manifest source hash mismatch')
    activity_out=CACHE/'vector'/'activities';activity_out.mkdir(parents=True)
    activity_modes=[('base',None),('task3','task3'),('carnival','carnival'),('carnival-walk','carnival-walk'),
        ('carnival-intro','carnival-intro'),('ludo','ludo'),('ludo-ai','ludo-ai'),
        ('portal-npcs','portal-npcs'),('portal-map','portal-map'),('court-verdict','court-verdict'),('endgame','endgame')]
    exported_clips=set()
    for label,mode_name in activity_modes:
        args=[jdk('java'),'-Xmx2g','-Djava.awt.headless=true','-Dstarcat.pixelDensity=2',
              '-classpath',cp,'ExportActivityAssets',str(play_swf),str(activity_out),str(CACHE/'scratch'/f'activity-{label}')]
        if mode_name:args.append(mode_name)
        exported=json.loads(run(args,CACHE/'logs'/f'activities-{label}-2x.log'))
        exported_clips.update(clip['id'] for clip in exported.get('clips',[]))
    expected_activity_files=set()
    activity_clips={clip['id']:clip for clip in activity_source['clips']}
    need(set(activity_clips).issubset(exported_clips),
         f'Activity SWF exporter missed clips: {sorted(set(activity_clips)-exported_clips)}')
    for clip in activity_source['clips']:
        for frame in clip['frames']:
            rel=rel_from_asset_url(frame['url']);vector_rel=rel.relative_to('activities')
            expected_activity_files.add(vector_rel.as_posix())
            source_frame=frame['sourceFrame']
            raw_frame=activity_out/vector_rel
            fitted_frame=CACHE/'vector'/'activities-fitted'/vector_rel
            fit_metadata=fit_transparent_canvas(raw_frame,fitted_frame,(frame['width'],frame['height']))
            vector_convert(fitted_frame,rel,'activities',(frame['width'],frame['height']),
                'public/original/play.swf',play_hash,
                {'sourceSymbol':clip['sourceSymbol'],'sourceFrame':source_frame,'fps':clip['fps'],
                 'loop':clip['loop'],'durationMs':1000/clip['fps'],
                 'logicalAnchor':[frame['offsetX'],frame['offsetY']],**fit_metadata},
                'JPEXS 2x original activity timeline; embedded source bitmaps retain their native detail')
    actual_activity_files={p.relative_to(activity_out).as_posix() for p in activity_out.rglob('*.png')}
    need(actual_activity_files==expected_activity_files,
         f'Activity exporter file coverage mismatch: missing={len(expected_activity_files-actual_activity_files)}, '
         f'extra={len(actual_activity_files-expected_activity_files)}')
    need(len(expected_activity_files)==1538,'Activity source frame count changed')
    print('HD activity sprites: 1538/1538 at 2x from original SWF timelines',flush=True)
    map_source=SOURCE/'map.png'
    with Image.open(map_source) as im:need(im.size==(2700,2552),'Original map source dimensions changed')
    expected={f'assets-hd/{p.relative_to(SOURCE).with_suffix(".webp").as_posix()}' for p in pngs}
    need(set(ENTRIES)==expected,
         f'HD asset coverage mismatch: missing {len(expected-set(ENTRIES))}, extra {len(set(ENTRIES)-expected)}')
    need(all(e['pixelDensity']==2 and e['pixelSize'][0]>0 and e['pixelSize'][1]>0 for e in ENTRIES.values()),
         'HD manifest contains an invalid pixel density or image size')
    vector_renders={'companySprites':12,'selectedBuildingCandidates':len(candidate_reports),
                    'propertySprites':len(property_source['sellSigns'])+len(property_source['houses']),
                    'worldFrames':sum(len(clip['frames']) for clip in world_source['clips'])+len(world_source['neutralHouses']),
                    'interactionFrames':len(interaction_source['cards'])+len(interaction_source['luck']),
                    'activityFrames':sum(len(clip['frames']) for clip in activity_source['clips']),
                    'exporterMetadata':{'companies':company_meta,'properties':property_meta,
                                        'world':world_meta,'interactions':interaction_meta}}
    company_patch_report={'sourceSha256':play_hash,'renderSwfSha256':digest(company_swf),
                          'bitmapIds':company_patch['bitmapIds'],'shapeIds':company_patch['shapeIds']}
    manifest={'version':1,'profile':'hd','pixelDensity':2,'format':'WebP q98 (lossy color; alpha quality 100)',
       'resampling':'Lanczos, premultiplied alpha for source bitmaps; character, company, property, world and interaction timelines exported at 2x',
       'map':{'sourceSha256':digest(map_source),'sourceWidth':2700,'sourceHeight':2552,'profileWidth':5400,'profileHeight':5104},
       'sourceAssetCount':len(pngs),'characters':char_reports,'buildingCandidates':candidate_reports,
       'companyPatch':company_patch_report,'vectorRenders':vector_renders,
       'files':sorted(ENTRIES.values(),key=lambda x:x['path'])}
    temp=DEST/'.hd-manifest.tmp';temp.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n');temp.replace(DEST/'hd-manifest.json')
    profile_manifest=DEST/'hd-manifest.json'
    profile_index={'version':1,'profile':'hd','pixelDensity':2,'sourceAssetCount':len(pngs),
       'assetCount':len(ENTRIES),'manifest':'hd-manifest.json','manifestSha256':digest(profile_manifest),
       'totalBytes':sum(p.stat().st_size for p in DEST.rglob('*.webp'))}
    profile_tmp=DEST/'.hd-profile.tmp'
    profile_tmp.write_text(json.dumps(profile_index,separators=(',',':'))+'\n')
    profile_tmp.replace(DEST/'hd-profile.json')
    (DEST/'.hd-build-in-progress').unlink()
    print(json.dumps({'sourcePngs':len(pngs),'profileFiles':len(ENTRIES),'characterRerenderedFiles':sum(1 for e in ENTRIES.values() if e.get('action')),
       'vectorRerenderedFiles':sum(1 for e in ENTRIES.values() if str(e.get('method','')).startswith('JPEXS 2x')),
       'outputBytes':sum(p.stat().st_size for p in DEST.rglob('*') if p.is_file()),
       'destination':DEST.relative_to(ROOT).as_posix()},ensure_ascii=False))
if __name__=='__main__':main()
