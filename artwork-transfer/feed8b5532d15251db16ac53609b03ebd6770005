import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch14-before/generation.json'));out=m.WORK/'reviews/batch-14';old_by={t['id']:t for t in before['tiles']}
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']=='e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653'
masters=0
for t in s['tiles']:
 for a in t['attempts']:
  assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
 for a in t.get('repairAttempts',[]):
  if 'masterPath' in a:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256']
 if m.is_ready(t) or t['status']=='pending-visual-review' and (m.WORK/'assembled'/f"{t['id']}.png").exists():
  if t.get('assembledSha256'):assert m.sha(m.WORK/'assembled'/f"{t['id']}.png")==t['assembledSha256']
new_ids=['r5c4','r4c6','r3c6','r2c7'];new_repairs=[r for r in s['repairs'] if r['id'] not in {a['id'] for a in before['repairs']}]
assert sorted(r['id'] for r in new_repairs)==sorted(['central-white-parcels-west-r1','central-long-dash-whole-r1','northeast-platform-lip-whole-r1','central-long-lane-complete-r1','tomorrow-city-glyph-native-reuse-r1'])
allowed={
'r5c3':[[864,1172,32,240]],'r5c5':[[1152,1172,24,240]],'r4c4':[[896,1140,256,32]],'r6c4':[[896,1412,256,32]],
'r4c5':[[1360,932,32,240]],'r4c7':[[1632,932,32,240]],'r5c6':[[1392,1172,240,32]],
'r3c5':[[1360,692,32,240]],'r3c7':[[1632,676,32,256],[1632,676,240,24]],'r2c8':[[1872,420,32,256]]}
for r in new_repairs:
 for rr in r.get('exportRects',[r['rect']]):
  for t in before['tiles']:
   ax,ay,aw,ah=rr;x,y,w,h=t['rect'];a,b=max(x,ax),max(y,ay);c,d=min(x+w,ax+aw),min(y+h,ay+ah)
   if a<c and b<d:allowed.setdefault(t['id'],[]).append([a,b,c-a,d-b])
protection=[]
for p in sorted((m.CACHE/'batch14-before/assembled').glob('*.png')):
 t=old_by[p.stem];q=m.WORK/'assembled'/p.name;a=np.array(Image.open(p).convert('RGBA'));b=np.array(Image.open(q).convert('RGBA'));changed=np.any(a!=b,axis=2);mask=np.zeros(changed.shape,bool);x,y,w,h=t['rect']
 if t['id'] in new_ids:mask[:]=True
 for ax,ay,aw,ah in allowed.get(t['id'],[]):mask[m.py(ay)-m.py(y):m.py(ay+ah)-m.py(y),m.px(ax)-m.px(x):m.px(ax+aw)-m.px(x)]=True
 assert not np.any(changed&~mask),(t['id'],'Unexpected change outside declared native repair/frame')
 if t['status']=='approved-source-reused':assert m.sha(p)==m.sha(q)
 protection.append({'id':t['id'],'changedPixels':int(changed.sum()),'byteIdentical':m.sha(p)==m.sha(q),'allowedSourceRects':allowed.get(t['id'],[]),'allChangesInsideDeclaredScope':True})
(out/'protection-audit.json').write_text(json.dumps(protection,indent=2)+'\n')
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256'],(r['id'],f['path'])
for r in new_repairs:
 f=m.WORK/'repairs'/r['id'];old=Image.open(f/'before.png').convert('RGBA');native=Image.open(f/'master.png').convert('RGBA');native_alpha_audit(native)
 if r.get('donorCanonicalFile'):new=Image.open(f/r['donorCanonicalFile']).convert('RGBA')
 elif 'canonicalNativeCrop' in r:
  rx,ry,rw,rh=r['referenceRect'];full=native.resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS);new=full.crop(tuple(r['canonicalNativeCrop']))
 else:new=native.resize(old.size,Image.Resampling.LANCZOS)
 mask=np.array(Image.open(f/'mask.png'))>0
 assert np.array_equal(np.where(mask[:,:,None],np.array(new),np.array(old)),np.array(Image.open(m.ROOT/r['files']['assembled.png']['path']).convert('RGBA')))
 assert all(st['meanRgbDifference']<=12 and st['p95RgbDifference']<=40 for st in r['seams'])
 if r['id']=='central-red-parcels-whole-r2':
  assert r['rect']==[864,1576,216,208] and r['referenceRect']==[864,1576,312,208]
  fullbefore=Image.open(f/'before-full.png').convert('RGBA');assert np.array_equal(np.array(fullbefore.crop(tuple(r['canonicalNativeCrop']))),np.array(old))
# The old unqualified road preview no longer contributes any pixels. New full
# corrected native road already carries all correct digits; no partial context
# is allowed to overwrite its whole blue30 or completed ride/parcel artwork.
old_preview=next(p for p in s['partialReviewRegions'] if p['repairId']=='west-road-ride-native-reassembly-r1');assert old_preview['exportRects']==[]
affected={r['id'] for r in protection if r['changedPixels']}|set(new_ids);alpha={}
for t in s['tiles']:
 if t['id'] in affected:
  x,y,w,h=t['rect'];im=Image.open(m.WORK/'assembled'/f"{t['id']}.png").convert('RGBA');ref=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h)) if t.get('sourceSkyReference') else None
  alpha[t['id']]=native_alpha_audit(im,permitted_reference=ref)
regions=json.load(open(out/'regions.json'))
for r in regions:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r['sha256']
 assert Image.open(p).size==tuple(r['pixelSize'])
grid=[r for r in regions if r['label']!='sign']
for i,a in enumerate(grid):
 for b in grid[i+1:]:
  ax,ay,aw,ah=a['logicalRect'];bx,by,bw,bh=b['logicalRect'];assert not(min(ax+aw,bx+bw)-max(ax,bx)>1e-7 and min(ay+ah,by+bh)-max(ay,by)>1e-7)
for tid in ['r2c2','r3c2']:
 t=next(t for t in s['tiles'] if t['id']==tid);r=next(r for r in regions if r['label']==tid);x,y,w,h=t['rect'];rx,ry,rw,rh=t['referenceRect'];raw=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS);right=raw.crop((m.px(x+w)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w+32)-m.px(rx),m.py(y+h)-m.py(ry)));atlas=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');assert np.array_equal(np.array(right),np.array(atlas.crop((m.px(x+w)-m.px(x),0,atlas.width,atlas.height))));assert r['replacementRect']==[x,y,w+32,h]
shutil.copy2(m.WORK/'reviews/batch-12/native-pilot-underlay-spec.json',out/'native-pilot-underlay-spec.json')
browser=json.load(open(out/'native-alpha-browser-verification.json'));assert not browser['errors'] and len(browser['views'])==34 and all(v['pending']==0 for v in browser['views']);cull=browser['legacyBaseCulling'];assert cull['url']=='/assets-hd/map.webp' and cull['pixelSize']==[5400,5104] and cull['logicalScale']==[2,2] and all(a==0 for a in cull['zeroAlphaSamples']) and cull['underlayZeroAlphaSamples']==[0,0]
for source,dest in [('batch14-formal-map-verification.json','formal-map-verification.json'),('batch14-static-protection-verification.json','static-protection-verification.json')]:shutil.copy2(m.CACHE/source,out/dest)
formal=json.load(open(out/'formal-map-verification.json'));static=json.load(open(out/'static-protection-verification.json'));assert formal['approvedRuntimeTiles']==4 and not formal['characterArtImported'];assert static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
new=json.load(open(out/'new-candidates.json'));assert sorted(t['id'] for t in new)==sorted(new_ids)
refs=[{'path':str(p.relative_to(m.ROOT)),'sha256':m.sha(p)} for p in sorted((m.WORK/'references/batch-14').rglob('*')) if p.is_file()];(out/'reference-inputs.json').write_text(json.dumps(refs,indent=2)+'\n')
for name in ['batch14-pack.py','batch14-native-alpha-review.mjs','test_batch14_sign_export.py','batch14-python-tests.log','batch14-map-npm-tests.log','batch14-sign-export-green.log']:shutil.copy2(m.CACHE/name,out/name)
assert 'Ran 27 tests' in (m.CACHE/'batch14-python-tests.log').read_text() and 'Ran 3 tests' in (m.CACHE/'batch14-python-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch14-python-tests.log').read_text()
assert 'Ran 27 tests' in (m.CACHE/'batch14-map-npm-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch14-map-npm-tests.log').read_text()
assert 'Ran 4 tests' in (m.CACHE/'batch14-sign-export-green.log').read_text() and 'FAILED' not in (m.CACHE/'batch14-sign-export-green.log').read_text()
v={'date':'2026-10-21','generator':'built-in image_gen','completedImageGenerationCallsThisBatch':9,'newCandidates':new_ids,'selectedTotal':sum(t['status']=='selected-engineering' for t in s['tiles']),'notGenerated':sum(t['status']=='pending' and not t['attempts'] for t in s['tiles']),'rework':sum(t['status']=='pending' and bool(t['attempts']) for t in s['tiles']),'pendingVisualReview':sum(t['status']=='pending-visual-review' for t in s['tiles']),'productionEnabled':False,'originalMapUnchanged':True,'approvedFourAssembliesByteIdentical':True,'immutableAttemptMasterHashesVerified':masters,'nativeRepairFileHashesVerified':True,'repairsAreExactOldOrNewPixelSelection':True,'minimumNewNativeDensity':min(t['nativePixelDensity'] for t in new),'newLocalRepairs':[r['id'] for r in new_repairs],'oldUnqualifiedWestRoadOverlayDisabled':True,'allPreviousAssemblyChangesInsideDeclaredScopes':True,'nativeAssembledAlphaAudits':alpha,'mapPythonTestsPassed':30,'mapNpmEntryPointTestsPassed':27,'completedExportRegressionWrongPixels':0,'actualNativeReplacementViews':len(browser['views']),'browserErrors':browser['errors'],'legacyBaseCulling':cull,'nonOverlappingGridDrawCoverageVerified':True,'reviewAtlasCount':len(regions),'nativePilotUnderlayReplayedExactly':True,'formalMapVerification':formal,'staticProtectionVerification':static,'referenceInputFilesHashed':len(refs),'fullMapUserAcceptance':'incomplete','projectUnitTestsPassed':643,'projectUnitTestFilesPassed':85}
assert [v[k] for k in ['selectedTotal','notGenerated','rework','pendingVisualReview','immutableAttemptMasterHashesVerified']]==[80,18,3,4,159]
# The unreviewed r3c5 top16 is never compared as a qualified anchor or altered.
t=next(t for t in s['tiles'] if t['id']=='r3c6');assert t['attempts'][-1]['neighborCoverageRects']=={'r3c5':[1152,692,240,240]};assert t['seams'][0]['comparisonRect']==[1360,692,32,240]
p=m.CACHE/'batch14-before/assembled/r3c5.png';q=m.WORK/'assembled/r3c5.png';a=np.array(Image.open(p).convert('RGBA'));b=np.array(Image.open(q).convert('RGBA'));assert np.array_equal(a[:m.py(692)-m.py(676)],b[:m.py(692)-m.py(676)])
r=next(r for r in regions if r['label']=='r3c5');assert r['coreRect']==[1152,692,240,240]
sg=s['partialReviewRegions'][0];plan=json.load(open(m.WORK/'references/batch-14/sign-scope/final-plan.json'));assert sg['exportRects']==[];assert m.sha(m.ROOT/sg['assembledPath'])==plan['sourceSha256'];title=next(p for p in s['partialReviewRegions'] if p['repairId']=='tomorrow-city-glyph-native-reuse-r1');assert title['exportRects']==plan['exportRects'];reuse=next(r for r in s['repairs'] if r['id']=='tomorrow-city-glyph-native-reuse-r1');baselineSign=next(r for r in json.load(open(m.WORK/'reviews/batch-13/regions.json')) if r['label']=='sign');assert m.sha(m.ROOT/reuse['sourcePreview']['path'])==reuse['sourcePreview']['sha256']==baselineSign['sha256'];small=next(p for p in s['partialReviewRegions'] if p['repairId']=='central-long-dash-whole-r1');assert small['exportRects']==[]
red=json.load(open(out/'sign-scope-before/regression-red.json'));green=json.load(open(m.CACHE/'batch14-sign-export-latest.json'));assert red['r4c6']['wrongPixels']==56027 and all(a['wrongPixels']==0 for a in green.values());(out/'sign-export-regression-green.json').write_text(json.dumps(green,indent=2)+'\n')
assert '643 passed' in (m.CACHE/'batch14-npm-test.log').read_text();shutil.copy2(m.CACHE/'batch14-npm-test.log',out/'batch14-npm-test.log')
v.update(qualifiedNeighborCoverage={'r3c5':[1152,692,240,240]},r3c5UnreviewedTop16BytesUnchanged=True,signContextExportRedWrongPixels=56027,signContextExportGreenWrongPixels=0,signCropUsesOnlyUnmodifiedRectangularNativePixels=True,remainingCoverageDebt='r3c5 top16 remains unreviewed; no false promotion')
v['remainingMaterialDebt']=['r7c1/r7c2 leaf scale','r5c0/r6c0 hue and scale','r8c1/r8c2 grass scale','pending-neighbor terrain and silhouette handoff'];v['reviewScreenshotHashes']=[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']]
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in v.items() if k not in ['nativeAssembledAlphaAudits','reviewScreenshotHashes']},ensure_ascii=False))
