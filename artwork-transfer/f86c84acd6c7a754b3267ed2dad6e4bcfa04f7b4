import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch17-before/generation.json'));out=m.WORK/'reviews/batch-17';old_by={t['id']:t for t in before['tiles']}
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']=='e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653'
masters=0
for t in s['tiles']:
 for a in t['attempts']:
  assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
 for a in t.get('repairAttempts',[]):
  if 'masterPath' in a:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256']
 if m.is_ready(t) or t['status']=='pending-visual-review' and (m.WORK/'assembled'/f"{t['id']}.png").exists():
  if t.get('assembledSha256'):assert m.sha(m.WORK/'assembled'/f"{t['id']}.png")==t['assembledSha256']
new_ids=['r1c9','r1c10','r0c9','r0c8'];new_repairs=[r for r in s['repairs'] if r['id'] not in {a['id'] for a in before['repairs']}]
assert sorted(r['id'] for r in new_repairs)==sorted(['northeast-cloud-bank-native-reuse-r1','northeast-cloud-crest-whole-joint-r1'])
allowed={'r1c8':[[2080,180,32,240],[1872,180,240,32]],'r2c9':[[2112,420,240,32]],'r2c10':[[2352,420,240,32]]}
for r in new_repairs:
 for rr in r.get('exportRects',[r['rect']]):
  for t in before['tiles']:
   ax,ay,aw,ah=rr;x,y,w,h=t['rect'];a,b=max(x,ax),max(y,ay);c,d=min(x+w,ax+aw),min(y+h,ay+ah)
   if a<c and b<d:allowed.setdefault(t['id'],[]).append([a,b,c-a,d-b])
protection=[]
for p in sorted((m.CACHE/'batch17-before/assembled').glob('*.png')):
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

affected={r['id'] for r in protection if r['changedPixels']}|set(new_ids);alpha={}
for t in s['tiles']:
 if t['id'] in affected:
  x,y,w,h=t['rect'];im=Image.open(m.WORK/'assembled'/f"{t['id']}.png").convert('RGBA');ref=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA').crop((x,y,x+w,y+h)) if t.get('sourceSkyReference') else None
  if not (np.array(im)[:,:,3]>=240).any():
   assert t.get('transparentContextOnly') and t['id']=='r0c9'
   original=np.array(ref)[:,:,3];assert original.max()==82 and (original>0).sum()==9 and np.array(im)[:,:,3].max()<=1
   alpha[t['id']]={'sourceHasNoSolidArtwork':True,'sourceMaxAlpha':82,'sourceNonzeroAlphaPixels':9,'nativeCoreMaxAlpha':int(np.array(im)[:,:,3].max()),'enclosedLowAlphaPixels':0,'nativeAlphaModified':False}
  else:alpha[t['id']]=native_alpha_audit(im,permitted_reference=ref)
regions=json.load(open(out/'regions.json'))
for r in regions:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r['sha256'];assert Image.open(p).size==tuple(r['pixelSize'])
grid=[r for r in regions if r['label']!='sign']
for i,a in enumerate(grid):
 for b in grid[i+1:]:
  ax,ay,aw,ah=a['logicalRect'];bx,by,bw,bh=b['logicalRect'];assert not(min(ax+aw,bx+bw)-max(ax,bx)>1e-7 and min(ay+ah,by+bh)-max(ay,by)>1e-7)
for tid in ['r2c2','r3c2']:
 t=next(t for t in s['tiles'] if t['id']==tid);r=next(r for r in regions if r['label']==tid);x,y,w,h=t['rect'];rx,ry,rw,rh=t['referenceRect'];raw=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS);right=raw.crop((m.px(x+w)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w+32)-m.px(rx),m.py(y+h)-m.py(ry)));atlas=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');assert np.array_equal(np.array(right),np.array(atlas.crop((m.px(x+w)-m.px(x),0,atlas.width,atlas.height))));assert r['replacementRect']==[x,y,w+32,h]
browser=json.load(open(out/'native-alpha-browser-verification.json'));assert not browser['errors'] and len(browser['views'])==20 and browser['regionCount']==len(regions) and all(v['pending']==0 for v in browser['views'])
assert any(v['name']=='upper-cloud-whole-2x' for v in browser['views'])
cull=browser['legacyBaseCulling'];assert cull['url']=='/assets-hd/map.webp' and cull['pixelSize']==[5400,5104] and cull['logicalScale']==[2,2] and all(a==0 for a in cull['zeroAlphaSamples']) and cull['underlayZeroAlphaSamples']==[0,0]
for source,dest in [('batch17-formal-map-verification.json','formal-map-verification.json'),('batch17-static-protection-verification.json','static-protection-verification.json')]:shutil.copy2(m.CACHE/source,out/dest)
formal=json.load(open(out/'formal-map-verification.json'));static=json.load(open(out/'static-protection-verification.json'));assert formal['approvedRuntimeTiles']==4 and not formal['characterArtImported'];assert static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
new=json.load(open(out/'new-candidates.json'));assert sorted(t['id'] for t in new)==sorted(new_ids)
for name in ['batch17-pack.py','batch17-native-alpha-review.mjs','test_batch17_preserved_exports.py','batch17-python-tests.log','batch17-map-npm-tests.log','batch17-preserved-export-tests.log']:shutil.copy2(m.CACHE/name,out/name)
assert 'Ran 27 tests' in (m.CACHE/'batch17-python-tests.log').read_text() and 'Ran 3 tests' in (m.CACHE/'batch17-python-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch17-python-tests.log').read_text()
assert 'Ran 27 tests' in (m.CACHE/'batch17-map-npm-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch17-map-npm-tests.log').read_text()
assert 'Ran 4 tests' in (m.CACHE/'batch17-preserved-export-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch17-preserved-export-tests.log').read_text()
green=json.load(open(m.CACHE/'batch17-preserved-export-latest.json'));assert all(a['wrongPixels']==0 for a in green.values())
# Previously closed top16 remains byte-identical; offsets include the unchanged east underlay.
assert m.sha(m.CACHE/'batch17-before/assembled/r3c5.png')==m.sha(m.WORK/'assembled/r3c5.png')
region=next(r for r in regions if r['label']=='r3c5');assert region['coreRect']==[1152,676,240,256]
working=Image.open(m.WORK/'assembled/r3c5.png').convert('RGBA');height=m.py(692)-m.py(676);atlas=Image.open(m.ROOT/'public/modern'/region['url']).convert('RGBA')
assert np.array_equal(np.array(atlas.crop((m.px(1152)-m.px(1120),0,atlas.width,height))),np.array(working)[:height])
# Reuse never imports the second frame's incorrect upper crowns.
r=next(r for r in new_repairs if r['id']=='northeast-cloud-bank-native-reuse-r1');mask=np.array(Image.open(m.ROOT/r['files']['mask.png']['path']));assert not mask[:m.py(420)-m.py(404)].any()
# Sky-only edge reuse is padded only where original alpha is exactly zero.
t=next(t for t in s['tiles'] if t['id']=='r0c9');rx,ry,rw,rh=t['referenceRect'];x,y,w,h=t['rect'];a=np.array(Image.open(m.ROOT/'public/modern/assets/map.png').getchannel('A').crop((x,y,x+w,y+h)));assert not a[:148].any() and a.max()==82
oldraw=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
expected=oldraw.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)))
actual=Image.open(m.WORK/'assembled/r0c9.png').convert('RGBA');n=m.px(2144)-m.px(2112);assert np.array_equal(np.array(expected)[:,n:],np.array(actual)[:,n:]);assert t['attempts'][0]['transparentCanvasPadding']['sourceNonzeroAlphaOutsideGeneratedReference']==0
v={'date':'2026-10-22','generator':'built-in image_gen','completedImageGenerationCallsThisBatch':6,'newEngineeringCandidates':new_ids,'selectedTotal':sum(t['status']=='selected-engineering' for t in s['tiles']),'notGenerated':sum(t['status']=='pending' and not t['attempts'] for t in s['tiles']),'rework':sum(t['status']=='pending' and bool(t['attempts']) for t in s['tiles']),'pendingVisualReview':sum(t['status']=='pending-visual-review' for t in s['tiles']),'productionEnabled':False,'originalMapUnchanged':True,'approvedFourAssembliesByteIdentical':True,'immutableAttemptMasterHashesVerified':masters,'nativeRepairFileHashesVerified':True,'repairsAreExactOldOrNewPixelSelection':True,'minimumNewNativeDensity':min(t['nativePixelDensity'] for t in new),'newLocalRepairs':[r['id'] for r in new_repairs if r.get('applied',True)],'withdrawnRepairs':[r['id'] for r in new_repairs if r.get('applied') is False],'allPreviousAssemblyChangesInsideDeclaredScopes':True,'nativeAssembledAlphaAudits':alpha,'mapPythonTestsPassed':30,'mapNpmEntryPointTestsPassed':27,'preservedExportRegressionTestsPassed':4,'completedExportRegressionWrongPixels':0,'actualNativeReplacementViews':len(browser['views']),'browserErrors':browser['errors'],'legacyBaseCulling':cull,'nonOverlappingGridDrawCoverageVerified':True,'reviewAtlasCount':len(regions),'nativePilotUnderlayReplayedExactly':True,'formalMapVerification':formal,'staticProtectionVerification':static,'fullMapUserAcceptance':'incomplete','newVisualCorrectionDebt':['Southwest/southeast accepted-sample corners retain native road/material phase differences; source-native whole-object review required','North approved fade remains pending r1c3/r1c4 correction; upper-cloud whole review awaits r0c7'],'rejectedWholeJointCorrectionsApplied':False,'r3c5Top16NativeCoverageClosed':True,'projectUnitTestsPassed':643,'projectUnitTestFilesPassed':85}
assert [v[k] for k in ['selectedTotal','notGenerated','rework','pendingVisualReview','immutableAttemptMasterHashesVerified']]==[93,8,0,4,181]
v['candidateReviewStatus']={t['id']:t['reviewStatus'] for t in new}
refs=m.WORK/'references/batch-17';v['referenceInputFilesHashed']=[{'path':str(f.relative_to(m.ROOT)),'sha256':m.sha(f)} for f in sorted(refs.rglob('*')) if f.is_file()]
assert cull['eastUnderlayZeroAlphaSamples']==[0,0]
assert '643 passed' in (m.CACHE/'batch17-npm-test.log').read_text()
assert 'Ran 3 tests' in (m.CACHE/'batch17-east-underlay-green.log').read_text() and 'FAILED' not in (m.CACHE/'batch17-east-underlay-green.log').read_text()
v['eastPilotNativeUnderlayReplacementVerified']=True
v['eastUnderlayRegressionTestsPassed']=3
assert cull['southUnderlayZeroAlphaSamples']==[0,0]
assert 'Ran 3 tests' in (m.CACHE/'batch17-south-underlay-green.log').read_text() and 'FAILED' not in (m.CACHE/'batch17-south-underlay-green.log').read_text()
v['southUnderlayRegressionTestsPassed']=3
v['southUnderlayRegressionRedSamples']=[255,255]
v['southUnderlayCornerOwnership']='Existing west/east own32x32 corners; two native224x32 strips fill the middle without overlap'
v['reviewScreenshotHashes']=[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']]
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in v.items() if k not in ['nativeAssembledAlphaAudits','reviewScreenshotHashes','legacyBaseCulling']},ensure_ascii=False))
