import sys,json,shutil,runpy
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch24-before/generation.json'));out=m.WORK/'reviews/batch-24';assert not s['productionEnabled'];assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256'];masters=0
for t in s['tiles']:
 p=m.WORK/'assembled'/f"{t['id']}.png";assert m.sha(p)==m.sha(m.CACHE/'batch24-before/assembled'/p.name)==t['assembledSha256']
 for a in t['attempts']:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
assert masters==192
for r in before['repairs']:assert next(v for v in s['repairs'] if v['id']==r['id'])['files']==r['files']
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
for t in json.load(open(m.ROOT/'public/modern/hd-masters/map/region-11-9-v2/masters.json'))['tiles']:assert m.sha(m.ROOT/t['sourcePath'])==t['sourceSha256']
rows=json.load(open(out/'regions.json'));prior=json.load(open(m.WORK/'reviews/batch-23/regions.json'));assert len(rows)==119
for r in prior:
 now=next(v for v in rows if v['label']==r['label']);assert now['sha256']==r['sha256']==m.sha(m.ROOT/'public/modern'/now['url'])
draw=json.load(open(out/'draw-regions.json'));assert len(draw)==149 and sum('sourcePixelCrop' in r for r in draw)==52 and sum(bool(r.get('spriteOnBase')) for r in draw)==2
for r in draw:
 p=m.ROOT/'public/modern'/r['url'];im=Image.open(p).convert('RGBA');assert list(im.size)==r['pixelSize']
 if 'sourcePixelCrop' in r:
  src=m.ROOT/'public/modern'/r['sourceUncarvedUrl'];assert m.sha(src)==r['sourceUncarvedSha256'];assert np.array_equal(np.array(im),np.array(Image.open(src).convert('RGBA').crop(tuple(r['sourcePixelCrop']))))
selected=['west-grass1412-whole-r1','west-grass-scale-transition-r1','yellow-building-empty-base-r3'];alphas={}
for rid in selected:
 r=next(r for r in s['repairs'] if r['id']==rid);assert r['nativePixelDensity']>=4 and r['reviewOverlayAfterApproved'];f=m.ROOT/r['files']['assembled.png']['path'];a=np.array(Image.open(m.ROOT/r['files']['before.png']['path']).convert('RGBA'));raw=Image.open(m.ROOT/r['files']['master.png']['path']).convert('RGBA');b=np.array(raw.resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS));mask=np.array(Image.open(m.ROOT/r['files']['mask.png']['path']))>0;compiled=Image.open(f).convert('RGBA');assert np.array_equal(np.array(compiled),np.where(mask[:,:,None],b,a));alphas[rid]=native_alpha_audit(compiled);assert all(t['meanRgbDifference']<=12 and t['p95RgbDifference']<=40 for t in r['seams'])
r=next(r for r in s['repairs'] if r['id']=='yellow-building-five-trees-r1');assert not r['reviewOverlayAfterApproved'] and not any(x['label']==r['id'] for x in rows)
props=s['nativePropPlacements'];assert len(props)==1
for prop in props:
 for f in prop['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
 raw=Image.open(m.ROOT/prop['files']['master.png']['path']).convert('RGBA');alphas['nativeCone']=native_alpha_audit(raw)
 for instance in prop['instances']:
  im=Image.open(m.ROOT/instance['path']).convert('RGBA');assert instance['nativeSourceDensity']>=4;assert np.array_equal(np.array(im),np.array(raw.resize(tuple(instance['technicalResize']),Image.Resampling.LANCZOS)));row=next(r for r in rows if r['label']==instance['id']);assert np.array_equal(np.array(im),np.array(Image.open(m.ROOT/'public/modern'/row['url']).convert('RGBA')))
browser=json.load(open(out/'native-alpha-browser-verification.json'));assert len(browser['views'])==32 and not browser['errors'] and all(v['pending']==0 for v in browser['views']);assert browser['drawRegionCount']==149 and browser['intentionalNativePropSpriteCount']==2 and browser['retainedExactSourceCrops']==52;assert browser['legacyBaseCulling']['url']=='/assets-hd/map.webp' and not any(browser['legacyBaseCulling']['zeroAlphaSamples'])
count=runpy.run_path(str(m.CACHE/'batch24-count-trees.py'))['count'];im=Image.open(out/'five-trees-whole-4x.png');components=count(im,4);assert len(components)==5;boxes=[]
for r in components:
 a,b,c,d=r['bounds'];boxes.append(np.array([380+(a-700)/4,1688+(b-550)/4,380+(c-700)/4,1688+(d-550)/4]))
geometry=[]
for target in [[448,1687,468,1710],[416,1710,435,1738]]:
 actual=min(boxes,key=lambda p:np.linalg.norm(p-target));error=float(np.abs(actual-target).max());assert error<=1.25;geometry.append({'sourceGreenBounds':target,'actualGreenBounds':actual.tolist(),'maximumWorldEdgeError':error})
logs={'python-tests':[27,3],'tree_count-green':[4],'tree-layout-green':[2],'draw_replacement-green':[4],'carve-green':[4],'corner_overlay-green':[5],'cloud-green':[6],'ne_reuse-green':[8],'preserved_exports-green':[4],'east_underlay-green':[3],'south_underlay-green':[3],'north_underlay-green':[3],'approved_north_ghost-green':[3]}
for name,counts in logs.items():
 p=m.CACHE/f'batch24-{name}.log';text=p.read_text();assert 'FAILED' not in text and all(f'Ran {n} tests' in text for n in counts),name;shutil.copy2(p,out/p.name)
for name in ['trees-red','tree-layout-red','overlap-red']:
 p=m.CACHE/f'batch24-{name}.log';assert 'FAILED (failures=1)' in p.read_text();shutil.copy2(p,out/p.name)
for name,expected in [('project-tests','643 passed'),('layer-order-green','4 passed'),('layer-order-red','1 failed'),('build-modern','built in')]:
 p=m.CACHE/f'batch24-{name}.log';assert expected in p.read_text(),name;shutil.copy2(p,out/p.name)
formal=json.load(open(m.CACHE/'batch24-formal-map-verification.json'));static=json.load(open(m.CACHE/'batch24-static-protection-verification.json'));assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
for name in ['formal-map-verification','static-protection-verification']:shutil.copy2(m.CACHE/f'batch24-{name}.json',out/(name+'.json'))
for name in ['pack.py','carve.py','audit.py','native-alpha-review.mjs','evaluate.py','quilt.py','count-trees.py']:shutil.copy2(m.CACHE/('batch24-'+name),out/('batch24-'+name))
for name in ['tree_count','original_tree_layout','draw_replacement','carve','corner_overlay','cloud','ne_reuse','preserved_exports','east_underlay','south_underlay','north_underlay','approved_north_ghost']:shutil.copy2(m.CACHE/('test_batch24_'+name+'.py'),out/('test_batch24_'+name+'.py'))
refs=m.WORK/'references/batch-24';refs.mkdir(exist_ok=True);shutil.copytree(m.CACHE/'batch24-inputs',refs/'inputs',dirs_exist_ok=True)
for rid in selected+['yellow-building-cone-native-cutout-r1','yellow-building-five-trees-r2']:
 shutil.copytree(m.CACHE/rid,refs/rid,dirs_exist_ok=True)
 if rid=='yellow-building-five-trees-r2':shutil.copy2(json.load(open(m.CACHE/rid/'generation.json'))['path'],refs/rid/'rejected-master.png')
v={'date':'2026-10-22','completedImageGenerationCallsThisBatch':6,'selectedNewSceneRepairs':selected,'selectedNativeProp':'native-props/yellow-building-cone-v1','rejectedGeometryCandidates':['yellow-building-five-trees-r1','yellow-building-five-trees-r2'],'all109WorkingAssembliesByteIdentical':True,'all192TileAttemptMastersUnchanged':True,'allPriorRepairFilesUnchanged':True,'approvedFourNativeAndRuntimeFilesUnchanged':True,'existing114ReviewAtlasesByteIdentical':True,'reviewAtlasCount':119,'drawRegionCount':149,'retainedExactRgbaCrops':52,'nativePropSpritesOnCleanBase':2,'alphaAudits':alphas,'originalWholeBuildingTrees':5,'beforeWholeBuildingTrees':3,'afterActualRenderTrees':5,'restoredTreeGeometry':geometry,'sourceGeometryToleranceWorldPixels':1.25,'existingThreeTreeNativePixelsUnchanged':True,'runtimeFix':{'path':'src/modern/features/map/MapScene.ts','addedLines':3,'behavior':'Stable mapRegions order instead of image arrival order','sha256':m.sha(m.ROOT/'src/modern/features/map/MapScene.ts'),'regression':'tests/e2e/modern-map-layer-order.spec.ts','testSha256':m.sha(m.ROOT/'tests/e2e/modern-map-layer-order.spec.ts'),'verifiedCameraVisits':3},'projectUnitTestsPassed':643,'modernE2eTestsPassed':4,'modernBuildPassed':True,'mapPythonTestsPassed':30,'nativeArtifactChecksPassed':49,'actualMapSceneViews':32,'browserErrors':[],'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','remaining':['Broad west leaf-scale difference remains visible despite softened local transition; do not mark whole grass pass accepted','Northeast lower grass/leaf-scale joins','Whole map asphalt grain and lighting review','Full map art acceptance and final integration'],'reviewScreenshotHashes':[{'view':v['name'],'sha256':m.sha(out/(v['name']+'.png'))} for v in browser['views']]};(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['afterActualRenderTrees','restoredTreeGeometry','all109WorkingAssembliesByteIdentical','drawRegionCount','projectUnitTestsPassed','modernE2eTestsPassed','productionEnabled']}))
