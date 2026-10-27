import sys,json,shutil,runpy
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.loads((m.CACHE/'batch25-before/generation.json').read_text());out=m.WORK/'reviews/batch-25';assert not s['productionEnabled'];assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256'];masters=0
for t in s['tiles']:
 p=m.WORK/'assembled'/f"{t['id']}.png";assert m.sha(p)==m.sha(m.CACHE/'batch25-before/assembled'/p.name)==t['assembledSha256']
 for a in t['attempts']:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
assert masters==192
for r in before['repairs']:assert next(v for v in s['repairs'] if v['id']==r['id'])['files']==r['files']
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
for t in json.loads((m.ROOT/'public/modern/hd-masters/map/region-11-9-v2/masters.json').read_text())['tiles']:assert m.sha(m.ROOT/t['sourcePath'])==t['sourceSha256']
for prop in before['nativePropPlacements']:assert next(v for v in s['nativePropPlacements'] if v['id']==prop['id'])['files']==prop['files']
rows=json.loads((out/'regions.json').read_text());prior=json.loads((m.WORK/'reviews/batch-24/regions.json').read_text());assert len(rows)==125
for r in prior:
 now=next(v for v in rows if v['label']==r['label']);assert r['sha256']==now['sha256']==m.sha(m.ROOT/'public/modern'/now['url'])
draw=json.loads((out/'draw-regions.json').read_text());assert len(draw)==160 and sum('sourcePixelCrop' in r for r in draw)==64 and sum(bool(r.get('spriteOnBase')) for r in draw)==4
for r in draw:
 p=m.ROOT/'public/modern'/r['url'];im=Image.open(p).convert('RGBA');assert list(im.size)==r['pixelSize']
 if 'sourcePixelCrop' in r:
  source=m.ROOT/'public/modern'/r['sourceUncarvedUrl'];assert m.sha(source)==r['sourceUncarvedSha256'];assert np.array_equal(np.array(im),np.array(Image.open(source).convert('RGBA').crop(tuple(r['sourcePixelCrop']))))
selected=['west-terrain-fine-south-r1','west-terrain-fine-middle-base-r3','west-terrain-fine-coast-r1','west-terrain-fine-north-base-r1'];alphas={};densities={}
for rid in selected:
 r=next(r for r in s['repairs'] if r['id']==rid);assert r['reviewOverlayAfterApproved'] and r['nativePixelDensity']>=4;f=m.ROOT/r['files']['assembled.png']['path'];a=np.array(Image.open(m.ROOT/r['files']['before.png']['path']).convert('RGBA'));raw=Image.open(m.ROOT/r['files']['master.png']['path']).convert('RGBA');b=np.array(raw.resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS));mask=np.array(Image.open(m.ROOT/r['files']['mask.png']['path']))>0;compiled=Image.open(f).convert('RGBA');assert np.array_equal(np.array(compiled),np.where(mask[:,:,None],b,a));alphas[rid]=native_alpha_audit(compiled);densities[rid]=r['nativePixelDensity'];assert all(x['meanRgbDifference']<=12 and x['p95RgbDifference']<=40 for x in r['seams'])
for rid in ['west-terrain-fine-middle-r1','west-terrain-fine-middle-base-r2']:
 r=next(r for r in s['repairs'] if r['id']==rid);assert not r['reviewOverlayAfterApproved'] and not any(x['label']==rid for x in rows)
for prop in s['nativePropPlacements']:
 for f in prop['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
 raw=Image.open(m.ROOT/prop['files']['master.png']['path']).convert('RGBA');alphas[prop['id']]=native_alpha_audit(raw)
 for instance in prop['instances']:
  im=Image.open(m.ROOT/instance['path']).convert('RGBA');assert instance['nativeSourceDensity']>=4;assert np.array_equal(np.array(im),np.array(raw.resize(tuple(instance['technicalResize']),Image.Resampling.LANCZOS)));row=next(r for r in rows if r['label']==instance['id']);assert np.array_equal(np.array(im),np.array(Image.open(m.ROOT/'public/modern'/row['url']).convert('RGBA')))
browser=json.loads((out/'native-alpha-browser-verification.json').read_text());extra=json.loads((out/'extra-edges-browser-verification.json').read_text());assert len(browser['views'])==39 and len(extra['views'])==2
for b in [browser,extra]:assert not b['errors'] and all(v['pending']==0 for v in b['views']) and b['drawRegionCount']==160 and b['intentionalNativePropSpriteCount']==4 and b['retainedExactSourceCrops']==64 and b['legacyBaseCulling']['url']=='/assets-hd/map.webp' and not any(b['legacyBaseCulling']['zeroAlphaSamples'])
count=runpy.run_path(str(m.CACHE/'batch25-count-trees.py'))['count'];components=count(Image.open(out/'five-trees-whole-4x.png'),4);assert len(components)==5;boxes=[]
for r in components:
 a,b,c,d=r['bounds'];boxes.append(np.array([380+(a-700)/4,1688+(b-550)/4,380+(c-700)/4,1688+(d-550)/4]))
geometry=[]
for target in [[448,1687,468,1710],[416,1710,435,1738]]:
 actual=min(boxes,key=lambda p:np.linalg.norm(p-target));error=float(np.abs(actual-target).max());assert error<=1.25;geometry.append({'sourceGreenBounds':target,'actualGreenBounds':actual.tolist(),'maximumWorldEdgeError':error})
logs={'python-tests':[27,3],'tree_count-green':[4],'original_tree_layout-green':[2],'draw_replacement-green':[4],'carve-green':[4],'corner_overlay-green':[5],'cloud-green':[6],'ne_reuse-green':[8],'preserved_exports-green':[4],'east_underlay-green':[3],'south_underlay-green':[3],'north_underlay-green':[3],'approved_north_ghost-green':[3],'road-retention-green':[3],'building-backing-green':[1],'cone-detector-green':[2],'canvas-coverage-green':[1],'clean-terrain-green':[2],'foreground-bounds-green':[1]}
for name,counts in logs.items():
 p=m.CACHE/f'batch25-{name}.log';text=p.read_text();assert 'FAILED' not in text and 'ResourceWarning' not in text and all(f'Ran {n} test' in text for n in counts),name;shutil.copy2(p,out/p.name)
for name,expected in [('road-retention-red','FAILED (failures=1)'),('building-backing-red','FAILED (failures=1)'),('cone-detector-red','FAILED (failures=1)'),('clean-terrain-red','FAILED (failures=2)'),('visible-bounds-red','2 failed'),('project-tests','643 passed'),('map-runtime-green','6 passed'),('build-modern','built in')]:
 p=m.CACHE/f'batch25-{name}.log';assert expected in p.read_text(),name;shutil.copy2(p,out/p.name)
formal=json.loads((m.CACHE/'batch25-formal-map-verification.json').read_text());static=json.loads((m.CACHE/'batch25-static-protection-verification.json').read_text());assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
for name in ['formal-map-verification','static-protection-verification']:shutil.copy2(m.CACHE/f'batch25-{name}.json',out/(name+'.json'))
for name in ['pack.py','carve.py','audit.py','native-alpha-review.mjs','extra-edges.mjs','evaluate.py','count-trees.py']:shutil.copy2(m.CACHE/('batch25-'+name),out/('batch25-'+name))
for name in ['tree_count','original_tree_layout','draw_replacement','carve','corner_overlay','cloud','ne_reuse','preserved_exports','east_underlay','south_underlay','north_underlay','approved_north_ghost','road_retention','building_grass_selection','cone_detector','canvas_coverage','clean_terrain','foreground_bounds']:shutil.copy2(m.CACHE/('test_batch25_'+name+'.py'),out/('test_batch25_'+name+'.py'))
refs=m.WORK/'references/batch-25';refs.mkdir(exist_ok=True);shutil.copytree(m.CACHE/'batch25-inputs',refs/'inputs',dirs_exist_ok=True)
for rid in selected+['west-terrain-fine-middle-r1','west-terrain-fine-middle-base-r2','west-round-tree-cutout-r1','west-coast-tree-cutout-r1']:shutil.copytree(m.CACHE/rid,refs/rid,dirs_exist_ok=True)
probes=json.loads((out/'canvas-coverage-probes.json').read_text());assert len(probes)==2
v={'date':'2026-10-23','completedImageGenerationCallsThisBatch':7,'selectedTerrainRepairs':selected,'selectedForegroundMasters':['native-props/west-round-tree-v1','native-props/west-coast-tree-v1'],'nativeTerrainDensities':densities,'assemblyReusedWithoutNewGeneration':'west-terrain-fine-middle-base-r3 reuses r2 native master, narrows original source protection to the actual foreground','withdrawnSelections':['middle-r1 coarse rectangle around retained tree','middle-base-r2 coarse backing beside building'], 'all109WorkingAssembliesByteIdentical':True,'all192TileAttemptMastersUnchanged':True,'allPriorRepairAndPropFilesUnchanged':True,'approvedFourNativeAndRuntimeFilesUnchanged':True,'existing119ReviewAtlasesByteIdentical':True,'reviewAtlasCount':125,'drawRegionCount':160,'retainedExactRgbaCrops':64,'nativeForegroundSpriteInstances':4,'alphaAudits':alphas,'afterActualRenderConeTrees':5,'existingConeTreeGeometry':geometry,'runtimeFix':{'path':'src/modern/features/map/MapScene.ts','changedBoundsExpressions':4,'behavior':'Calculate visible map bounds from the full canvas and viewport offset/scale, including tall/wide extensions','sha256':m.sha(m.ROOT/'src/modern/features/map/MapScene.ts'),'regression':'tests/e2e/modern-map-visible-bounds.spec.ts','testSha256':m.sha(m.ROOT/'tests/e2e/modern-map-visible-bounds.spec.ts'),'priorFixedLayerOrderPreserved':True},'projectUnitTestsPassed':643,'modernE2eTestsPassed':6,'modernBuildPassed':True,'mapPythonTestsPassed':30,'nativeArtifactChecksPassed':59,'actualMapSceneViews':41,'browserErrors':[],'canvasEdgeNativeProbes':probes,'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','openConnections':[{'id':'west-upper-cloud-terrain-cap','sourceEdge':'north terrain y1264 and upper-right grass','review':'terrain-north-open-4x.png','priority':1,'note':'Visible contour/material handoff remains, do not mark complete or activate full replacement.'},{'id':'west-east-lower-grass-balance','note':'Whole-map review still checks the x432 material handoff; local close-ups inspected, not final art acceptance.'},{'id':'northeast-grass-and-road-material','priority':2}],'remaining':['Close west upper cloud/terrain handoff','Northeast grass and whole-map grass balance','Whole map asphalt grain and lighting review','Full map art acceptance and final integration'],'reviewScreenshotHashes':[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']+extra['views']]};(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['all109WorkingAssembliesByteIdentical','nativeTerrainDensities','afterActualRenderConeTrees','actualMapSceneViews','projectUnitTestsPassed','modernE2eTestsPassed','productionEnabled']}))
