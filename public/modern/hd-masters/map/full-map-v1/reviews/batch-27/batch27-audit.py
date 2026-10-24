import sys,json,shutil
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
from verify_full_hd_map_assets import verify
out=m.WORK/'reviews/batch-27';s=m.read();before=json.loads((m.CACHE/'batch26-before/generation.json').read_text())
assert s['productionEnabled'] and s['installedArtwork']['userVisualAcceptance']=='pending'
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']
masters=0
for t in s['tiles']:
 p=m.WORK/'assembled'/f"{t['id']}.png";assert m.sha(p)==m.sha(m.CACHE/'batch26-before/assembled'/p.name)==t['assembledSha256']
 for a in t['attempts']:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
assert len(s['tiles'])==109 and masters==192
for r in before['repairs']:assert next(v for v in s['repairs'] if v['id']==r['id'])['files']==r['files']
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
assert s['nativePropPlacements']==before['nativePropPlacements']
for prop in s['nativePropPlacements']:
 for f in prop['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
 for instance in prop['instances']:assert m.sha(m.ROOT/instance['path'])==instance['sha256']
rows=json.loads((out/'regions.json').read_text());old=json.loads((m.WORK/'reviews/batch-26/regions.json').read_text());draw=json.loads((out/'draw-regions.json').read_text())
assert len(old)==126 and len(rows)==129 and len(draw)==178
for r in old:
 now=next(v for v in rows if v['label']==r['label']);assert now['sha256']==r['sha256']==m.sha(m.ROOT/'public/modern'/now['url'])
assert sum('sourcePixelCrop' in r for r in draw)==94 and sum(bool(r.get('spriteOnBase')) for r in draw)==4
for r in draw:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r.get('sha256',r.get('outputSha256'))
 if 'sourcePixelCrop' in r:
  source=m.ROOT/'public/modern'/r['sourceUncarvedUrl'];assert m.sha(source)==r['sourceUncarvedSha256']
  assert np.array_equal(np.array(Image.open(p).convert('RGBA')),np.array(Image.open(source).convert('RGBA').crop(tuple(r['sourcePixelCrop']))))
alphas={}
for rid in ['south-bridge-material-r1','pilot-curb-native-continuation-r1','green30-whole-native-r1']:
 f=m.WORK/'repairs'/rid;a=np.array(Image.open(f/'before.png').convert('RGBA'));b=np.array(Image.open(f/'master.png').convert('RGBA').resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS));mask=np.array(Image.open(f/'mask.png'))>0;expected=np.where(mask[:,:,None],b,a)
 if rid=='pilot-curb-native-continuation-r1':
  sky=np.array(Image.open(f/'native-sky-donor.png').convert('RGBA'));sky_mask=np.array(Image.open(f/'sky-selection.png'))>0;expected=np.where(sky_mask[:,:,None],sky,expected)
 compiled=Image.open(f/'assembled.png').convert('RGBA');assert np.array_equal(expected,np.array(compiled));alphas[rid]=native_alpha_audit(compiled)
full=verify();assert full['nativeRegions']==178
manifest=m.ROOT/'public/modern/hd-map/full-map-v1/manifest.json';art=json.loads(manifest.read_text());assert s['installedArtwork']['manifestSha256']==m.sha(manifest)
assert m.sha(m.ROOT/'dist-modern/hd-map/full-map-v1/manifest.json')==m.sha(manifest)
for r in art['mapRegions']+[art['baseMap']]:assert m.sha(m.ROOT/'dist-modern'/r['path'])==r['outputSha256']
runtime=json.loads((out/'installed-runtime-browser-verification.json').read_text());global_views=json.loads((out/'native-alpha-browser-verification.json').read_text());bridge=json.loads((out/'bridge-browser-verification.json').read_text())
for result,n in [(runtime,14),(global_views,13),(bridge,5)]:assert len(result['views'])==n and not result['errors']
assert runtime['noFetchOrAlphaOverrides'] and not any(p in ['/assets-hd/map.webp','/assets/map.png'] or p.startswith('/hd-masters/') for p in runtime['requests'])
assert len(set(p for p in runtime['requests'] if '/hd-map/full-map-v1/part-' in p))==178
for name,markers in [('project-tests',['648 passed']),('map-runtime-final',['7 passed']),('natural-replay-performance',['2 passed']),('map-python',['Ran 29 tests','Ran 3 tests']),('artifact-tests',['Ran 10 tests']),('build-modern',['built in'])]:
 p=m.CACHE/f'batch27-{name}.log';text=p.read_text();assert all(v in text for v in markers) and 'FAILED (' not in text and 'error TS' not in text,name;shutil.copy2(p,out/p.name)
for name in ['bridge-red','bridge-green','pilot-curb-red','pilot-sky-red','pilot-alpha-red','pilot-curb-green','green30-red','green30-green','full-parser-red','full-parser-green','full-composition-red','full-composition-green','overview-underlay-red','overview-underlay-green']:
 p=m.CACHE/f'batch27-{name}.log';assert p.exists();shutil.copy2(p,out/p.name)
formal=json.loads((m.CACHE/'batch27-formal-map-verification.json').read_text());static=json.loads((m.CACHE/'batch27-static-protection-verification.json').read_text());assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['complete']
assert static['installedJobs']==142 and static['installedPaths']==211
for name in ['formal-map-verification','static-protection-verification','full-map-asset-verification']:shutil.copy2(m.CACHE/f'batch27-{name}.json',out/(name+'.json'))
for name in ['audit.py','carve.py','checkpoint.py','evaluate.py','global-review.mjs','bridge-review.mjs','runtime-review.mjs']:shutil.copy2(m.CACHE/('batch27-'+name),out/('batch27-'+name))
for p in m.CACHE.glob('test_batch27_*.py'):shutil.copy2(p,out/p.name)
refs=m.WORK/'references/batch-27';refs.mkdir(exist_ok=True)
for rid in ['south-bridge-material-r1','pilot-curb-native-continuation-r1','green30-whole-native-r1']:shutil.copytree(m.CACHE/rid,refs/rid,dirs_exist_ok=True)
g=json.loads((m.CACHE/'south-bridge-material-r1/generation.json').read_text());prompt={'tool':'GPT built-in image_gen','completedGenerationCalls':1,'calls':[{'id':'south-bridge-material-r1','prompt':g['prompt'],'savedNativeMaster':'public/modern/hd-masters/map/full-map-v1/repairs/south-bridge-material-r1/master.png'}],'nativeReuseWithoutNewGeneration':['pilot-curb-native-continuation-r1','green30-whole-native-r1']};(out/'prompts.json').write_text(json.dumps(prompt,ensure_ascii=False,indent=2)+'\n')
performance=None
for line in (m.CACHE/'batch27-natural-replay-performance.log').read_text().splitlines():
 if line.startswith('HD production resource audit '):performance=json.loads(line.removeprefix('HD production resource audit '))
assert performance and performance['maxProfileDimension']<=performance['maxTextureSize'] and not performance['failedResponses']
v={'date':'2026-10-23','phase':'installed-awaiting-final-user-confirmation','builtInGenerationCalls':1,'nativeReuseCorrections':2,'all109WorkingAssembliesUnchanged':True,'all192TileMastersUnchanged':True,'allPriorRepairAndPropFilesUnchanged':True,'prior126ReviewAtlasesUnchanged':True,'approvedFourFilesUnchanged':formal,'staticProtection':static,'runtimeManifest':str(manifest.relative_to(m.ROOT)),'runtimeManifestSha256':m.sha(manifest),'installedNativeRegions':178,'nativeForegroundSprites':4,'retainedExactRgbaCrops':94,'overviewReplay':full,'repairAlphaAudits':alphas,'projectUnitTests':648,'mapPythonTests':32,'newArtifactTests':10,'relatedE2eTests':9,'buildModernPassed':True,'globalReviewViews':13,'bridgeViews':5,'installedRuntimeViews':14,'browserErrors':[],'usesOldMapBehindNativeArt':False,'noFetchOrAlphaOverridesInInstalledReview':True,'productionEnabled':True,'userFinalConfirmation':'pending','remainingGeneration':0,'knownVisualCorrectionTasks':0,'remaining':['Final user visual confirmation required by the user-provided AGENTS.md'],'resourceMeasurement':performance,'resourceMeasurementNote':'ResourceTiming wire bytes and encoded body bytes; decoded dimensions sum includes images released during startup, not actual resident memory.','sourceCodeSha256':{name:m.sha(m.ROOT/name) for name in ['src/modern/ModernApp.vue','src/modern/features/assets/hd-map-art.ts','src/modern/features/map/MapScene.ts','scripts/package_full_hd_map.py','scripts/verify_full_hd_map_assets.py']},'installedScreenshotHashes':[{'name':view['mode']+'-'+view['name'],'sha256':m.sha(out/(view['mode']+'-'+view['name']+'.png'))} for view in runtime['views']]};(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['installedNativeRegions','projectUnitTests','mapPythonTests','newArtifactTests','relatedE2eTests','productionEnabled','userFinalConfirmation']}))
