"""Build the 5A map and complete walk/reaction sample.

Use the bundled Python with Pillow/numpy and set FFDEC_JAVA to a JDK:
  FFDEC_JAVA=/path/to/java /path/to/python scripts/build-modern-hd-sample.py
Only .analysis-cache and public/modern/hd-review/5a/generated are rebuilt.
"""
from __future__ import annotations
import hashlib, importlib.util, json, math, os, shutil, subprocess
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DENSITY=2.0
CANDIDATE=ROOT/'public/hd-review/juanmao-hd-v2.png'
SOURCE=ROOT/'public/original/star1.swf'
FFDEC=Path(os.environ.get('FFDEC_ROOT',ROOT/'.analysis-tools/ffdec-26.2.1/full')).resolve()
JAVA=os.environ.get('FFDEC_JAVA',shutil.which('java') or '')
CACHE=ROOT/'.analysis-cache/hd-sample-5a'
def require(ok,msg):
    if not ok: raise SystemExit(msg)
def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(131072),b''): h.update(b)
    return h.hexdigest()
def binary(name):
    j=Path(JAVA).expanduser()
    sibling=j.with_name(name) if j.is_absolute() and j.name=='java' else None
    if sibling and sibling.is_file(): return str(sibling)
    import shutil as sh
    found=sh.which(name)
    if found: return found
    raise SystemExit(f'JDK {name} not found; set FFDEC_JAVA to a JDK path')
def run(args,log):
    result=subprocess.run(args,cwd=ROOT,text=True,capture_output=True)
    log.parent.mkdir(parents=True,exist_ok=True);log.write_text(result.stdout+result.stderr)
    if result.returncode: raise SystemExit(f'Failed; inspect {log.relative_to(ROOT)}')
    return result.stdout
def check_png(path,size):
    with Image.open(path) as im:
        im.load()
        require(im.format=='PNG' and im.mode=='RGBA',f'Not RGBA PNG: {path}')
        require(im.size==size,f'Unexpected size for {path}: {im.size}, expected {size}')
        require(im.getchannel('A').getextrema()==(0,255),f'Alpha mask changed: {path}')
def main():
    require(JAVA!='','Set FFDEC_JAVA to a JDK')
    require(CANDIDATE.is_file(),'Missing reviewed 5A candidate')
    require((FFDEC/'lib/ffdec_lib.jar').is_file(),'JPEXS 26.2.1 library missing')
    original_manifest=json.loads((ROOT/'public/original/manifest.json').read_text())
    source_hash=sha(SOURCE)
    expected=next(x['sha256'] for x in original_manifest['files'] if x['name']=='star1.swf')
    require(source_hash==expected,'Original character SWF hash mismatch')
    if CACHE.exists(): shutil.rmtree(CACHE)
    assets=CACHE/'staging/assets';assets.mkdir(parents=True)
    work_swf=CACHE/'star1-hd.swf'
    spec=importlib.util.spec_from_file_location('hd_assets',ROOT/'scripts/hd_assets.py')
    require(spec is not None and spec.loader is not None,'HD image pipeline unavailable')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    module.OUTPUT=assets;module.REVIEW=ROOT/'public/hd-review'
    shutil.copyfile(CANDIDATE,assets/'juanmao.png')
    patched=module.patch_swf(SOURCE,work_swf,[{'key':'juanmao','tag':1,'swf':'star1.swf',
        'originalFile':'juanmao-original.jpg','type':'character'}])
    classes=CACHE/'classes';classes.mkdir()
    cp=str(FFDEC/'lib'/'*')
    run([binary('javac'),'-classpath',cp,'-d',str(classes),
         str(ROOT/'scripts/ExportModernWalkAssets.java'),
         str(ROOT/'scripts/ExportReactionAssets.java')],CACHE/'compile.log')
    cp=f'{classes}:{cp}'
    walk=assets/'characters/1/walk';walk_scratch=CACHE/'scratch/walk'
    wm=json.loads(run([binary('java'),'-Xmx2g','-Djava.awt.headless=true','-classpath',cp,
        'ExportModernWalkAssets',str(work_swf),str(walk),str(walk_scratch),str(DENSITY)],CACHE/'walk.log'))
    require(wm['pixelDensity']==DENSITY and len(wm['clips'])==4,'Walk export metadata incomplete')
    require([x['frameCount'] for x in wm['clips']]==[24]*4,'Walk frame counts changed')
    for clip in wm['clips']:
        x0,x1,y0,y1=clip['sourceBoundsTwips']
        size=(math.ceil((x1-x0)*DENSITY/20),math.ceil((y1-y0)*DENSITY/20))
        for i in range(1,25): check_png(walk/clip['facing']/f'{i}.png',size)
    reactions=assets/'characters/1/reactions';rs=CACHE/'scratch/reactions'
    rm=json.loads(run([binary('java'),'-Xmx2g','-Djava.awt.headless=true',
        f'-Dstarcat.pixelDensity={DENSITY}','-classpath',cp,'ExportReactionAssets',
        str(work_swf),str(reactions),str(rs),'1'],CACHE/'reactions.log'))
    require(rm['characterId']==1 and len(rm['clips'])==20 and len(rm['godOverlays'])==6,
            'Reaction/god overlay export incomplete')
    for clip in rm['clips']:
        x0,x1,y0,y1=clip['renderBoundsTwips']
        size=(math.ceil((x1-x0)*DENSITY/20),math.ceil((y1-y0)*DENSITY/20))
        for i in range(1,clip['frames']+1):
            check_png(reactions/clip['name']/clip['facing']/f'{i}.png',size)
    for item in rm['godOverlays']:
        x0,x1,y0,y1=item['renderBoundsTwips']
        check_png(reactions/'gods'/f"{item['godId']}.png",
                  (math.ceil((x1-x0)*DENSITY/20),math.ceil((y1-y0)*DENSITY/20)))
    map_path=ROOT/'public/modern/assets/map.png'
    with Image.open(map_path) as im: require(im.size==(2700,2552) and im.mode=='RGBA','Original map source changed')
    map_info=json.loads((ROOT/'public/modern/assets/manifest.json').read_text())['map']
    require((map_info['width'],map_info['height'])==(2700,2552),'Map metadata mismatch')
    out=ROOT/'public/modern/hd-review/5a'
    target=out/'generated'
    if target.exists(): shutil.rmtree(target)
    out.mkdir(parents=True,exist_ok=True)
    shutil.copytree(assets,target)
    files=[]
    for p in sorted(target.rglob('*.png')):
        files.append({'path':p.relative_to(out).as_posix(),
                      'sha256':sha(p),'size':list(Image.open(p).size)})
    timeline_frames=sum(clip['frameCount'] for clip in wm['clips']) + \
        sum(clip['frames'] for clip in rm['clips']) + len(rm['godOverlays'])
    require(timeline_frames==871 and len(files)==872,
            f'Expected 871 timeline frames plus candidate source, got {timeline_frames} and {len(files)}')
    manifest={'version':1,'sample':'5A','tool':'JPEXS 26.2.1','pixelDensity':DENSITY,
        'map':{'url':'assets/map.png','sha256':sha(map_path),'width':2700,'height':2552,
               'mode':'original native master; no scaling or redraw'},
        'character':{'id':1,'name':'卷毛','sourceSha256':source_hash,
                     'patchedWorkSha256':sha(work_swf),'candidate':'../../../hd-review/juanmao-hd-v2.png',
                     'candidateSha256':sha(CANDIDATE),'walk':wm,'reactions':rm},
        'timelinePngFrames':timeline_frames,'files':files}
    (out/'sample-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'map':'2700x2552 original','walk':'4 x 24 at 30fps',
        'reactionClips':20,'godOverlays':6,'pixelDensity':2,'frames':len(files),
        'pngFiles':len(files),'directory':str(out.relative_to(ROOT))},ensure_ascii=False))
if __name__=='__main__': main()
