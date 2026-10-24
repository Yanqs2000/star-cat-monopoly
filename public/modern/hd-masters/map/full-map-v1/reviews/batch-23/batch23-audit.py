import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch23-before/generation.json'));out=m.WORK/'reviews/batch-23';assert not s['productionEnabled'];assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256'];masters=0
for t in s['tiles']:
 p=m.WORK/'assembled'/f"{t['id']}.png";assert m.sha(p)==m.sha(m.CACHE/'batch23-before/assembled'/p.name)==t['assembledSha256']
 for a in t['attempts']:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
assert masters==192
for r in before['repairs']:
 now=next(v for v in s['repairs'] if v['id']==r['id']);assert now['files']==r['files']
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
meta=json.load(open(m.ROOT/'public/modern/hd-masters/map/region-11-9-v2/masters.json'))
for r in meta['tiles']:assert m.sha(m.ROOT/r['sourcePath'])==r['sourceSha256']
rows=json.load(open(out/'regions.json'));prior=json.load(open(m.WORK/'reviews/batch-22/regions.json'));assert len(rows)==114
for r in prior:
 now=next(v for v in rows if v['label']==r['label']);assert r['sha256']==now['sha256']==m.sha(m.ROOT/'public/modern'/now['url'])
draw=json.load(open(out/'draw-regions.json'));assert len(draw)==132 and sum('sourcePixelCrop' in r for r in draw)==30
for r in draw:
 im=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');assert list(im.size)==r['pixelSize']
 if 'sourcePixelCrop' in r:
  p=m.ROOT/'public/modern'/r['sourceUncarvedUrl'];assert m.sha(p)==r['sourceUncarvedSha256'];assert np.array_equal(np.array(im),np.array(Image.open(p).convert('RGBA').crop(tuple(r['sourcePixelCrop']))))
new=next(r for r in s['repairs'] if r['id']=='upper-cloud-complete-r2');assert len(s['repairs'])==len(before['repairs'])+1;raw=Image.open(m.ROOT/new['files']['master.png']['path']).convert('RGBA');compiled=Image.open(m.ROOT/new['files']['assembled.png']['path']).convert('RGBA');assert np.array_equal(np.array(raw.resize(compiled.size,Image.Resampling.LANCZOS)),np.array(compiled));alpha=native_alpha_audit(raw);assert new['nativePixelDensity']>=4 and new['silhouetteIoU']>.99
browser=json.load(open(out/'native-alpha-browser-verification.json'));assert len(browser['views'])==26 and not browser['errors'] and all(v['pending']==0 for v in browser['views']);assert browser['drawRegionCount']==132 and browser['retainedExactSourceCrops']==30;assert browser['legacyBaseCulling']['url']=='/assets-hd/map.webp' and not any(browser['legacyBaseCulling']['zeroAlphaSamples'])
logs={'python-tests':[27,3],'cloud-green':[6],'draw_replacement-green':[4],'carve-green':[4],'corner_overlay-green':[5],'ne_reuse-green':[8],'preserved_exports-green':[4],'east_underlay-green':[3],'south_underlay-green':[3],'north_underlay-green':[3],'approved_north_ghost-green':[3]}
for name,counts in logs.items():
 p=m.CACHE/f'batch23-{name}.log';text=p.read_text();assert 'FAILED' not in text and all(f'Ran {n} tests' in text for n in counts),name;shutil.copy2(p,out/p.name)
formal=json.load(open(m.CACHE/'batch23-formal-map-verification.json'));static=json.load(open(m.CACHE/'batch23-static-protection-verification.json'));assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
for name in ['formal-map-verification','static-protection-verification']:shutil.copy2(m.CACHE/f'batch23-{name}.json',out/(name+'.json'))
for name in ['pack.py','carve.py','audit.py','native-alpha-review.mjs','register.py']:shutil.copy2(m.CACHE/('batch23-'+name),out/('batch23-'+name))
for name in ['cloud','draw_replacement','carve','corner_overlay','ne_reuse','preserved_exports','east_underlay','south_underlay','north_underlay','approved_north_ghost']:shutil.copy2(m.CACHE/('test_batch23_'+name+'.py'),out/('test_batch23_'+name+'.py'))
refs=m.WORK/'references/batch-23';refs.mkdir(exist_ok=True)
for rid in ['upper-cloud-complete-r1','upper-cloud-complete-r2']:shutil.copytree(m.CACHE/rid,refs/rid,dirs_exist_ok=True)
g=json.load(open(m.CACHE/'upper-cloud-complete-r1/generation.json'));shutil.copy2(g['path'],refs/'upper-cloud-complete-r1/rejected-master.png')
v={'date':'2026-10-22','completedImageGenerationCallsThisBatch':2,'selectedNewRepairs':['upper-cloud-complete-r2'],'rejectedRepairs':[{'id':'upper-cloud-complete-r1','reason':'Native density3.82 below4; not applied'}],'nativePixelDensity':new['nativePixelDensity'],'nativePixelSize':list(raw.size),'wholeNativeSpriteNoInteriorCuts':True,'silhouetteIoU':new['silhouetteIoU'],'alphaAudit':alpha,'counts':{'selected-engineering':105,'approved-source-reused':4,'pending':0},'immutableAttemptMasterHashesVerified':192,'all109WorkingAssembliesByteIdentical':True,'allPriorRepairFilesUnchanged':True,'approvedFourNativeAndRuntimeFilesUnchanged':True,'existing113ReviewAtlasesByteIdentical':True,'reviewAtlasCount':114,'drawRegionCount':132,'retainedExactRgbaCrops':30,'replacementDoesNotDoubleCompositeAlpha':True,'newCloudTestsPassed':6,'priorLocalTestsPassed':13,'mapPythonTestsPassed':30,'priorNortheastExportUnderlayTestsPassed':24,'actualMapSceneViews':26,'browserErrors':[],'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','remaining':['remaining-grass-texture-joins','whole-map-road-grain-review','full-map-final-review'],'reviewScreenshotHashes':[{'view':v['name'],'sha256':m.sha(out/(v['name']+'.png'))} for v in browser['views']]};(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['nativePixelDensity','silhouetteIoU','all109WorkingAssembliesByteIdentical','drawRegionCount','actualMapSceneViews','productionEnabled']}))
