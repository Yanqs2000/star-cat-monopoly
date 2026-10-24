import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch15-before/generation.json'));out=m.WORK/'reviews/batch-15';old_by={t['id']:t for t in before['tiles']}
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']=='e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653'
masters=0
for t in s['tiles']:
 for a in t['attempts']:
  assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
 for a in t.get('repairAttempts',[]):
  if 'masterPath' in a:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256']
 if m.is_ready(t) or t['status']=='pending-visual-review' and (m.WORK/'assembled'/f"{t['id']}.png").exists():
  if t.get('assembledSha256'):assert m.sha(m.WORK/'assembled'/f"{t['id']}.png")==t['assembledSha256']
new_ids=['r5c8','r7c5','r8c5','r8c6','r2c6'];new_repairs=[r for r in s['repairs'] if r['id'] not in {a['id'] for a in before['repairs']}]
assert sorted(r['id'] for r in new_repairs)==sorted(['south-cliff-phantom-stone-remove-r1','east-parcel-road-platform-joint-r2'])
allowed={
'r7c4':[[1120,1652,32,240]],'r7c6':[[1392,1652,32,240],[1392,1860,240,32]],'r6c5':[[1152,1620,240,32]],
'r8c4':[[1120,1892,32,240]],'r9c5':[[1152,2132,240,32]],
'r5c7':[[1840,1172,32,240]],'r5c9':[[2112,1172,32,240]],'r4c8':[[1872,1140,240,32]],'r6c8':[[1872,1412,240,32]],
'r8c5':[[1360,1892,32,240]],'r8c7':[[1632,1892,32,240]],'r9c6':[[1392,2132,240,32]],
'r2c7':[[1632,420,32,256]],'r3c6':[[1392,676,240,24]]}
for r in new_repairs:
 for rr in r.get('exportRects',[r['rect']]):
  for t in before['tiles']:
   ax,ay,aw,ah=rr;x,y,w,h=t['rect'];a,b=max(x,ax),max(y,ay);c,d=min(x+w,ax+aw),min(y+h,ay+ah)
   if a<c and b<d:allowed.setdefault(t['id'],[]).append([a,b,c-a,d-b])
protection=[]
for p in sorted((m.CACHE/'batch15-before/assembled').glob('*.png')):
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
  alpha[t['id']]=native_alpha_audit(im,permitted_reference=ref)
regions=json.load(open(out/'regions.json'))
for r in regions:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r['sha256'];assert Image.open(p).size==tuple(r['pixelSize'])
grid=[r for r in regions if r['label']!='sign']
for i,a in enumerate(grid):
 for b in grid[i+1:]:
  ax,ay,aw,ah=a['logicalRect'];bx,by,bw,bh=b['logicalRect'];assert not(min(ax+aw,bx+bw)-max(ax,bx)>1e-7 and min(ay+ah,by+bh)-max(ay,by)>1e-7)
for tid in ['r2c2','r3c2']:
 t=next(t for t in s['tiles'] if t['id']==tid);r=next(r for r in regions if r['label']==tid);x,y,w,h=t['rect'];rx,ry,rw,rh=t['referenceRect'];raw=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS);right=raw.crop((m.px(x+w)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w+32)-m.px(rx),m.py(y+h)-m.py(ry)));atlas=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');assert np.array_equal(np.array(right),np.array(atlas.crop((m.px(x+w)-m.px(x),0,atlas.width,atlas.height))));assert r['replacementRect']==[x,y,w+32,h]
# Local stone correction has full native coverage through the entire hallucinated object.
r=next(r for r in new_repairs if r['id']=='south-cliff-phantom-stone-remove-r1');f=m.WORK/'repairs'/r['id'];x,y,_,_=r['rect'];box=(m.px(1128)-m.px(x),m.py(1856)-m.py(y),m.px(1164)-m.px(x),m.py(1900)-m.py(y));mask=np.array(Image.open(f/'mask.png').crop(box));assert mask.min()==255
old=np.array(Image.open(f/'before.png').convert('RGB').crop(box));new=np.array(Image.open(f/'assembled.png').convert('RGB').crop(box))
gray=lambda a: int(((np.ptp(a.astype(int),axis=2)<20)&(a.min(axis=2)>35)).sum())
stone={'oldGrayPixels':gray(old),'newGrayPixels':gray(new),'newPixelsFromNativeOnly':True};assert stone['oldGrayPixels']>1000 and stone['newGrayPixels']==0
browser=json.load(open(out/'native-alpha-browser-verification.json'));assert not browser['errors'] and len(browser['views'])==33 and browser['regionCount']==len(regions) and all(v['pending']==0 for v in browser['views'])
assert any(v['name']=='upper-cloud-whole-2x' for v in browser['views'])
cull=browser['legacyBaseCulling'];assert cull['url']=='/assets-hd/map.webp' and cull['pixelSize']==[5400,5104] and cull['logicalScale']==[2,2] and all(a==0 for a in cull['zeroAlphaSamples']) and cull['underlayZeroAlphaSamples']==[0,0]
for source,dest in [('batch15-formal-map-verification.json','formal-map-verification.json'),('batch15-static-protection-verification.json','static-protection-verification.json')]:shutil.copy2(m.CACHE/source,out/dest)
formal=json.load(open(out/'formal-map-verification.json'));static=json.load(open(out/'static-protection-verification.json'));assert formal['approvedRuntimeTiles']==4 and not formal['characterArtImported'];assert static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
new=json.load(open(out/'new-candidates.json'));assert sorted(t['id'] for t in new)==sorted(new_ids)
for name in ['batch15-pack.py','batch15-native-alpha-review.mjs','test_batch15_preserved_exports.py','batch15-python-tests.log','batch15-map-npm-tests.log','batch15-preserved-export-tests.log']:shutil.copy2(m.CACHE/name,out/name)
assert 'Ran 27 tests' in (m.CACHE/'batch15-python-tests.log').read_text() and 'Ran 3 tests' in (m.CACHE/'batch15-python-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch15-python-tests.log').read_text()
assert 'Ran 27 tests' in (m.CACHE/'batch15-map-npm-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch15-map-npm-tests.log').read_text()
assert 'Ran 4 tests' in (m.CACHE/'batch15-preserved-export-tests.log').read_text() and 'FAILED' not in (m.CACHE/'batch15-preserved-export-tests.log').read_text()
green=json.load(open(m.CACHE/'batch15-preserved-export-latest.json'));assert all(a['wrongPixels']==0 for a in green.values())
# Historical r3c5 top16 is deliberately excluded and byte untouched.
a=np.array(Image.open(m.CACHE/'batch15-before/assembled/r3c5.png'));b=np.array(Image.open(m.WORK/'assembled/r3c5.png'));assert np.array_equal(a[:m.py(692)-m.py(676)],b[:m.py(692)-m.py(676)])
assert next(r for r in regions if r['label']=='r3c5')['coreRect']==[1152,692,240,240]
v={'date':'2026-10-22','generator':'built-in image_gen','completedImageGenerationCallsThisBatch':13,'newEngineeringCandidates':new_ids,'selectedTotal':sum(t['status']=='selected-engineering' for t in s['tiles']),'notGenerated':sum(t['status']=='pending' and not t['attempts'] for t in s['tiles']),'rework':sum(t['status']=='pending' and bool(t['attempts']) for t in s['tiles']),'pendingVisualReview':sum(t['status']=='pending-visual-review' for t in s['tiles']),'productionEnabled':False,'originalMapUnchanged':True,'approvedFourAssembliesByteIdentical':True,'immutableAttemptMasterHashesVerified':masters,'nativeRepairFileHashesVerified':True,'repairsAreExactOldOrNewPixelSelection':True,'minimumNewNativeDensity':min(t['nativePixelDensity'] for t in new),'newLocalRepairs':[r['id'] for r in new_repairs],'allPreviousAssemblyChangesInsideDeclaredScopes':True,'nativeAssembledAlphaAudits':alpha,'mapPythonTestsPassed':30,'mapNpmEntryPointTestsPassed':27,'preservedExportRegressionTestsPassed':4,'completedExportRegressionWrongPixels':0,'actualNativeReplacementViews':len(browser['views']),'browserErrors':browser['errors'],'legacyBaseCulling':cull,'nonOverlappingGridDrawCoverageVerified':True,'reviewAtlasCount':len(regions),'nativePilotUnderlayReplayedExactly':True,'formalMapVerification':formal,'staticProtectionVerification':static,'fullMapUserAcceptance':'incomplete','phantomStoneSourceAudit':stone,'newVisualCorrectionDebt':['r8c6 left road/curb and grass handoff','r8c6 bottom river/shore/cliff hue line'],'rejectedWholeJointCorrectionsApplied':False,'r3c5UnreviewedTop16BytesUnchanged':True,'projectDefaultSuite':'not rerun this batch; no runtime code change; batch14 643 passed'}
assert [v[k] for k in ['selectedTotal','notGenerated','rework','pendingVisualReview','immutableAttemptMasterHashesVerified']]==[85,15,1,4,168]
v['newVisualCorrectionDebt'].append('r2c6 right golden cliff lip minor step near1632,470')
v['candidateReviewStatus']={t['id']:t['reviewStatus'] for t in new}
refs=m.WORK/'references/batch-15';v['referenceInputFilesHashed']=[{'path':str(f.relative_to(m.ROOT)),'sha256':m.sha(f)} for f in sorted(refs.rglob('*')) if f.is_file()]
v['reviewScreenshotHashes']=[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']]
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in v.items() if k not in ['nativeAssembledAlphaAudits','reviewScreenshotHashes','legacyBaseCulling']},ensure_ascii=False))
