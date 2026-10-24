import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts')
import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.loads((m.CACHE/'batch26-before/generation.json').read_text())
out=m.WORK/'reviews/batch-26';rid='west-upper-terrain-cap-r2'
assert not s['productionEnabled']
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']
masters=0
for t in s['tiles']:
 p=m.WORK/'assembled'/f"{t['id']}.png"
 assert m.sha(p)==m.sha(m.CACHE/'batch26-before/assembled'/p.name)==t['assembledSha256']
 for a in t['attempts']:
  assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
assert masters==192
for old in before['repairs']:
 assert next(r for r in s['repairs'] if r['id']==old['id'])['files']==old['files']
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
assert s['nativePropPlacements']==before['nativePropPlacements']
for prop in s['nativePropPlacements']:
 for f in prop['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
 for instance in prop['instances']:assert m.sha(m.ROOT/instance['path'])==instance['sha256']
rows=json.loads((out/'regions.json').read_text());prior=json.loads((m.WORK/'reviews/batch-25/regions.json').read_text())
assert len(rows)==126 and len(prior)==125
for old in prior:
 r=next(r for r in rows if r['label']==old['label'])
 assert old['sha256']==r['sha256']==m.sha(m.ROOT/'public/modern'/r['url'])
draw=json.loads((out/'draw-regions.json').read_text())
assert len(draw)==163 and sum('sourcePixelCrop' in r for r in draw)==70
assert sum(bool(r.get('spriteOnBase')) for r in draw)==4
for r in draw:
 path=m.ROOT/'public/modern'/r['url'];im=Image.open(path).convert('RGBA')
 assert list(im.size)==r['pixelSize'] and m.sha(path)==r.get('sha256',r.get('outputSha256'))
 if 'sourcePixelCrop' in r:
  source=m.ROOT/'public/modern'/r['sourceUncarvedUrl']
  assert m.sha(source)==r['sourceUncarvedSha256']
  assert np.array_equal(np.array(im),np.array(Image.open(source).convert('RGBA').crop(tuple(r['sourcePixelCrop']))))
r=next(r for r in s['repairs'] if r['id']==rid);f=m.WORK/'repairs'/rid
a=np.array(Image.open(f/'before.png').convert('RGBA'));raw=Image.open(f/'master.png').convert('RGBA')
b=np.array(raw.resize((a.shape[1],a.shape[0]),Image.Resampling.LANCZOS));mask=np.array(Image.open(f/'mask.png'))>0
compiled=Image.open(f/'assembled.png').convert('RGBA')
assert np.array_equal(np.array(compiled),np.where(mask[:,:,None],b,a))
alpha={name:native_alpha_audit(im) for name,im in [('master',raw),('assembled',compiled)]}
assert all(v['enclosedLowAlphaPixels']==0 for v in alpha.values())
assert r['nativePixelDensity']>=4
assert all(x['meanRgbDifference']<=12 and x['p95RgbDifference']<=40 for x in r['seams'])
browsers=[json.loads((out/name).read_text()) for name in ['native-alpha-browser-verification.json','northeast-browser-verification.json']]
for browser,views in zip(browsers,[9,7]):
 assert len(browser['views'])==views and not browser['errors']
 assert all(v['pending']==0 for v in browser['views'])
 assert browser['drawRegionCount']==163 and browser['intentionalNativePropSpriteCount']==4
 assert browser['legacyBaseCulling']['url']=='/assets-hd/map.webp'
 assert not any(browser['legacyBaseCulling']['zeroAlphaSamples'])
for name,count in [('artifact-tests',37),('cap-green',4)]:
 text=(m.CACHE/f'batch26-{name}.log').read_text()
 assert f'Ran {count} tests' in text and 'FAILED' not in text
text=(m.CACHE/'batch26-map-python.log').read_text()
assert 'Ran 27 tests' in text and 'Ran 3 tests' in text and 'FAILED' not in text
formal=json.loads((m.CACHE/'batch26-formal-map-verification.json').read_text())
static=json.loads((m.CACHE/'batch26-static-protection-verification.json').read_text())
assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81
prior_verification=json.loads((m.WORK/'reviews/batch-25/verification.json').read_text())
assert m.sha(m.ROOT/'src/modern/features/map/MapScene.ts')==prior_verification['runtimeFix']['sha256']
for name in ['pack.py','carve.py','audit.py','evaluate.py','native-alpha-review.mjs','northeast-review.mjs']:
 shutil.copy2(m.CACHE/('batch26-'+name),out/('batch26-'+name))
for name in ['cap-red.log','cap-green.log','map-python.log','artifact-tests.log','formal-map-verification.json','static-protection-verification.json']:
 shutil.copy2(m.CACHE/('batch26-'+name),out/('batch26-'+name))
for path in m.CACHE.glob('test_batch26_*.py'):shutil.copy2(path,out/path.name)
refs=m.WORK/'references/batch-26';refs.mkdir(exist_ok=True)
for name in ['west-upper-terrain-cap-r1','west-upper-terrain-cap-r2','northeast-grass-field-r1']:
 shutil.copytree(m.CACHE/name,refs/name,dirs_exist_ok=True)
rejected=json.loads((m.CACHE/'west-upper-terrain-cap-r1/generation.json').read_text())
shutil.copy2(rejected['path'],refs/'west-upper-terrain-cap-r1/master-rejected.png')
v={'date':'2026-10-23','builtInImageGenerationCalls':2,'selectedRepair':rid,
 'rejectedCandidates':['west-upper-terrain-cap-r1: stippled grain differs from existing rounded grass'],
 'nativePixelSize':list(raw.size),'nativeDensity':r['nativePixelDensity'],
 'all109WorkingAssembliesUnchanged':True,'all192TileMastersUnchanged':True,
 'allPriorRepairAndPropFilesUnchanged':True,'all125PriorReviewAtlasesUnchanged':True,
 'approvedMapVerification':formal,'staticVerification':static,'productCodeUnchangedSinceBatch25':True,
 'reviewAtlasCount':126,'drawRegionCount':163,'retainedExactRgbaCrops':70,'nativePropInstances':4,
 'nativeOldNewRgbaExact':True,'alphaAudits':alpha,'artifactTestsPassed':37,'mapPythonTestsPassed':30,
 'actualMapSceneViews':16,'browserErrors':[],
 'visualReview':{'westY1264':'Original horizontal coastline/material cutoff removed in actual4x; original cyan10 retained; whole native cloud preserves existing lobes/curl/layout without interior cuts; old curb notch removed.',
 'westPerimeters':'Top/cliff, right/curb, bottom/grass and left/cloud/sky checked; broader west grass balance remains whole-map review.',
 'northeast':'Six actual2x/4x views checked. Existing hospital edge, field and outer-coast art retained; no regeneration performed for these finished assets.'},
 'remaining':['Whole-map terrain/material balance including west x432','Whole-map asphalt grain and lighting transitions','Full replacement integration and final visual acceptance'],
 'productionEnabled':False,'fullMapAccepted':False,
 'screenshots':[{'name':view['name'],'sha256':m.sha(out/(view['name']+'.png'))} for browser in browsers for view in browser['views']]}
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
prompts=[]
for name,selected in [('west-upper-terrain-cap-r1',False),('west-upper-terrain-cap-r2',True)]:
 g=json.loads((m.CACHE/name/'generation.json').read_text());prompts.append({'id':name,'tool':'GPT built-in image_gen','selected':selected,'prompt':g['prompt'],'savedNativeMaster':str((f/'master.png' if selected else refs/name/'master-rejected.png').relative_to(m.ROOT))})
(out/'prompts.json').write_text(json.dumps({'calls':prompts},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v[k] for k in ['selectedRepair','nativeDensity','artifactTestsPassed','mapPythonTestsPassed','actualMapSceneViews','productionEnabled']}))
