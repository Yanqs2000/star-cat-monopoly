import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
s=m.read();before=json.load(open(m.CACHE/'batch22-before/generation.json'));out=m.WORK/'reviews/batch-22';oldids={r['id'] for r in before['repairs']};new=[r for r in s['repairs'] if r['id'] not in oldids];assert [r['id'] for r in new]==['southwest-curb-whole-joint-r1','southeast-road-whole-joint-r1'];assert not s['productionEnabled'];assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256'];masters=0
for t in s['tiles']:
 p=m.WORK/'assembled'/f"{t['id']}.png";assert m.sha(p)==m.sha(m.CACHE/'batch22-before/assembled'/p.name)==t['assembledSha256']
 for a in t['attempts']:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
assert masters==192
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
for r in before['repairs']:assert next(v for v in s['repairs'] if v['id']==r['id'])['files']==r['files']
meta=json.load(open(m.ROOT/'public/modern/hd-masters/map/region-11-9-v2/masters.json'))
for t in meta['tiles']:assert m.sha(m.ROOT/t['sourcePath'])==t['sourceSha256']
rows=json.load(open(out/'regions.json'));prior=json.load(open(m.WORK/'reviews/batch-21/regions.json'));assert len(rows)==113
for r in prior:
 now=next(v for v in rows if v['label']==r['label']);assert r['sha256']==now['sha256'];assert m.sha(m.ROOT/'public/modern'/now['url'])==now['sha256']
draw=json.load(open(out/'draw-regions.json'));assert len(draw)==127 and sum('sourcePixelCrop' in r for r in draw)==20
for r in draw:
 p=m.ROOT/'public/modern'/r['url'];im=Image.open(p).convert('RGBA');assert list(im.size)==r['pixelSize']
 if 'sourcePixelCrop' in r:
  src=m.ROOT/'public/modern'/r['sourceUncarvedUrl'];assert m.sha(src)==r['sourceUncarvedSha256'];assert np.array_equal(np.array(Image.open(src).convert('RGBA').crop(tuple(r['sourcePixelCrop']))),np.array(im))
for r in new:
 f=m.ROOT/r['files']['assembled.png']['path'];a=np.array(Image.open(m.ROOT/r['files']['before.png']['path']).convert('RGBA'));raw=Image.open(m.ROOT/r['files']['master.png']['path']).convert('RGBA');b=np.array(raw.resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS));mask=np.array(Image.open(m.ROOT/r['files']['mask.png']['path']))>0;assert np.array_equal(np.array(Image.open(f).convert('RGBA')),np.where(mask[:,:,None],b,a));assert raw.getchannel('A').getextrema()==(255,255);assert r['nativePixelDensity']>=4;assert all(x['meanRgbDifference']<=12 and x['p95RgbDifference']<=40 for x in r['seams'])
browser=json.load(open(out/'native-alpha-browser-verification.json'));assert len(browser['views'])==23 and not browser['errors'] and all(v['pending']==0 for v in browser['views']);assert browser['drawRegionCount']==127 and browser['retainedExactSourceCrops']==20 and browser['noAlphaDoubleCompositionAtWholeJointPatches'];assert browser['legacyBaseCulling']['url']=='/assets-hd/map.webp' and not any(browser['legacyBaseCulling']['zeroAlphaSamples'])
logs={'python-tests':[27,3],'preserved-export-tests':[4],'ne-reuse-green':[8],'east_underlay-green':[3],'south_underlay-green':[3],'north_underlay-green':[3],'approved_north_ghost-green':[3],'corner-green':[5],'draw-green':[4],'carve-green':[4]}
for name,counts in logs.items():
 p=m.CACHE/f'batch22-{name}.log';text=p.read_text();assert 'FAILED' not in text and all(f'Ran {n} tests' in text for n in counts),name;shutil.copy2(p,out/p.name)
for name in ['double-draw-red','curb-red']:
 p=m.CACHE/f'batch22-{name}.log';assert 'FAILED (failures=1)' in p.read_text();shutil.copy2(p,out/p.name)
formal=json.load(open(m.CACHE/'batch22-formal-map-verification.json'));static=json.load(open(m.CACHE/'batch22-static-protection-verification.json'));assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
for name in ['formal-map-verification','static-protection-verification']:shutil.copy2(m.CACHE/f'batch22-{name}.json',out/(name+'.json'))
for name in ['pack.py','carve.py','audit.py','native-alpha-review.mjs','register-overlay.py','evaluate.py']:shutil.copy2(m.CACHE/('batch22-'+name),out/('batch22-'+name))
for name in ['corner_overlay','draw_replacement','carve','preserved_exports','ne_reuse','east_underlay','south_underlay','north_underlay','approved_north_ghost']:shutil.copy2(m.CACHE/('test_batch22_'+name+'.py'),out/('test_batch22_'+name+'.py'))
refs=m.WORK/'references/batch-22';refs.mkdir(exist_ok=True);shutil.copytree(m.CACHE/'batch22-inputs',refs/'inputs',dirs_exist_ok=True);shutil.copytree(m.CACHE/'batch22-sw-trial',refs/'rejected-native-reuse',dirs_exist_ok=True)
for rid in [r['id'] for r in new]:shutil.copy2(m.CACHE/rid/'native-target.png',refs/(rid+'-native-target.png'))
v={'date':'2026-10-22','completedImageGenerationCallsThisBatch':2,'failedImageGenerationCallsThisBatch':1,'failedCallReason':'Connection failed before image was returned; same built-in request retried once','newEngineeringCandidates':[],'reviewOnlyJointRepairs':[r['id'] for r in new],'counts':{'selected-engineering':105,'approved-source-reused':4,'pending':0},'immutableAttemptMasterHashesVerified':masters,'all109WorkingAssembliesByteIdentical':True,'allPriorRepairFilesUnchanged':True,'approvedFourNativeAndRuntimeFilesUnchanged':True,'existing111ReviewAtlasesByteIdentical':True,'reviewAtlasCount':113,'drawRegionCount':127,'retainedExactRgbaCrops':20,'replacementDoesNotDoubleCompositeAlpha':True,'newRegressionTestsPassed':13,'mapPythonTestsPassed':30,'existingExportTestsPassed':4,'existingNortheastTestsPassed':8,'existingUnderlayAndGhostTestsPassed':12,'actualMapSceneViews':23,'browserErrors':[],'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','remaining':['upper-cloud-whole-review','remaining-grass-texture-joins','whole-map-road-grain-review','full-map-final-review'],'newRepairSeams':{r['id']:r['seams'] for r in new},'reviewScreenshotHashes':[{'view':v['name'],'sha256':m.sha(out/(v['name']+'.png'))} for v in browser['views']]};(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['reviewOnlyJointRepairs','all109WorkingAssembliesByteIdentical','drawRegionCount','newRegressionTestsPassed','actualMapSceneViews','productionEnabled']}))
