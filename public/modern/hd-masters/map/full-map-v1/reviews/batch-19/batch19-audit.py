import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch19-before/generation.json'));out=m.WORK/'reviews/batch-19';old={t['id']:t for t in before['tiles']}
new_ids=['r1c3','r1c4']
repairs=[r for r in s['repairs'] if r['id'] not in {a['id'] for a in before['repairs']}]
assert sorted(r['id'] for r in repairs)==['northeast-whole-tree-shading-r1','northwest-cloud-main-crown-whole-r2','northwest-whole-tree-shading-r1']
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']=='e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653'
masters=0
for t in s['tiles']:
 for a in t['attempts']:
  assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
 for a in t.get('repairAttempts',[]):
  if 'masterPath' in a:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256']
 if m.is_ready(t) and t.get('assembledSha256'):assert m.sha(m.WORK/'assembled'/f"{t['id']}.png")==t['assembledSha256']
allowed={'r1c2':[[608,180,32,240]],'r0c3':[[640,148,256,32]],'r0c4':[[896,148,256,32]],'r1c5':[[1152,180,24,240]]}
for r in repairs:
 for t in before['tiles']:
  ax,ay,aw,ah=r['rect'];x,y,w,h=t['rect'];a,b=max(x,ax),max(y,ay);c,d=min(x+w,ax+aw),min(y+h,ay+ah)
  if a<c and b<d:allowed.setdefault(t['id'],[]).append([a,b,c-a,d-b])
protection=[]
for p in sorted((m.CACHE/'batch19-before/assembled').glob('*.png')):
 t=old[p.stem];q=m.WORK/'assembled'/p.name;a=np.array(Image.open(p).convert('RGBA'));b=np.array(Image.open(q).convert('RGBA'));changed=np.any(a!=b,axis=2);mask=np.zeros(changed.shape,bool);x,y,w,h=t['rect']
 if t['id'] in new_ids:mask[:]=True
 for ax,ay,aw,ah in allowed.get(t['id'],[]):mask[m.py(ay)-m.py(y):m.py(ay+ah)-m.py(y),m.px(ax)-m.px(x):m.px(ax+aw)-m.px(x)]=True
 assert not np.any(changed&~mask),(t['id'],'Change outside declared scope')
 if t['status']=='approved-source-reused':assert m.sha(p)==m.sha(q)
 protection.append({'id':t['id'],'changedPixels':int(changed.sum()),'byteIdentical':m.sha(p)==m.sha(q),'allowedSourceRects':allowed.get(t['id'],[]),'allChangesInsideDeclaredScope':True})
(out/'protection-audit.json').write_text(json.dumps(protection,indent=2))
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256'],r['id']
for r in repairs:
 f=m.WORK/'repairs'/r['id'];oldim=Image.open(f/'before.png').convert('RGBA');native=Image.open(f/'master.png').convert('RGBA');native_alpha_audit(native)
 new=native.resize(oldim.size,Image.Resampling.LANCZOS);mask=np.array(Image.open(f/'mask.png'))>0
 assert np.array_equal(np.where(mask[:,:,None],np.array(new),np.array(oldim)),np.array(Image.open(f/'assembled.png').convert('RGBA')))
 assert all(st['meanRgbDifference']<=12 and st['p95RgbDifference']<=40 for st in r['seams'])
affected={p['id'] for p in protection if p['changedPixels']}|set(new_ids);alpha={}
original=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA')
for t in s['tiles']:
 if t['id'] in affected:
  x,y,w,h=t['rect'];im=Image.open(m.WORK/'assembled'/f"{t['id']}.png").convert('RGBA');ref=original.crop((x,y,x+w,y+h)) if t.get('sourceSkyReference') else None
  alpha[t['id']]=native_alpha_audit(im,permitted_reference=ref)
regions=json.load(open(out/'regions.json'));grid=[r for r in regions if r['label']!='sign']
for r in regions:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r['sha256'] and Image.open(p).size==tuple(r['pixelSize'])
for i,a in enumerate(grid):
 for b in grid[i+1:]:
  ax,ay,aw,ah=a['logicalRect'];bx,by,bw,bh=b['logicalRect'];assert not(min(ax+aw,bx+bw)-max(ax,bx)>1e-7 and min(ay+ah,by+bh)-max(ay,by)>1e-7)
assert m.sha(m.CACHE/'batch19-before/assembled/r3c5.png')==m.sha(m.WORK/'assembled/r3c5.png')
browser=json.load(open(out/'native-alpha-browser-verification.json'));cull=browser['legacyBaseCulling']
assert not browser['errors'] and len(browser['views'])==20 and browser['regionCount']==len(regions)==110 and all(v['pending']==0 for v in browser['views'])
assert cull['url']=='/assets-hd/map.webp' and cull['pixelSize']==[5400,5104] and cull['logicalScale']==[2,2] and all(a==0 for a in cull['zeroAlphaSamples'])
for key in ['underlayZeroAlphaSamples','eastUnderlayZeroAlphaSamples','southUnderlayZeroAlphaSamples','northUnderlayZeroAlphaSamples']:assert cull[key]==[0,0]
for name,counts in [('python-tests',[27,3]),('preserved-export-tests',[4]),('east-underlay-green',[3]),('south-underlay-green',[3]),('north-underlay-green',[3]),('approved-north-ghost-green',[3])]:
 p=m.CACHE/f'batch19-{name}.log';content=p.read_text();assert 'FAILED' not in content and all(f'Ran {n} tests' in content for n in counts);shutil.copy2(p,out/p.name)
for name in ['formal-map-verification','static-protection-verification']:
 p=m.CACHE/f'batch19-{name}.json';shutil.copy2(p,out/(name+'.json'))
formal=json.load(open(out/'formal-map-verification.json'));static=json.load(open(out/'static-protection-verification.json'))
assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
counts={k:sum(t['status']==k for t in s['tiles']) for k in ['selected-engineering','pending','pending-visual-review','approved-source-reused']}
assert list(counts.values())==[103,0,2,4] and masters==192
for name in ['batch19-pack.py','batch19-native-alpha-review.mjs','batch19-register.py','batch19-accept-native.py','batch19-audit.py','test_batch19_preserved_exports.py','test_batch19_east_underlay.py','test_batch19_south_underlay.py','test_batch19_north_underlay.py','test_batch19_approved_north_ghost.py']:shutil.copy2(m.CACHE/name,out/name)
refs=m.WORK/'references/batch-19';refs.mkdir(exist_ok=True)
for folder in ['batch19-inputs','northwest-whole-tree-shading-r1','northeast-whole-tree-shading-r1','northwest-cloud-main-crown-whole-r1','northwest-cloud-main-crown-whole-r2']:shutil.copytree(m.CACHE/folder,refs/folder,dirs_exist_ok=True)
v={'date':'2026-10-22','completedImageGenerationCallsThisBatch':6,'nativeContextReusedCells':[],'newEngineeringCandidates':new_ids,'counts':counts,'immutableAttemptMasterHashesVerified':masters,'originalMapUnchanged':True,'approvedFourAssembliesByteIdentical':True,'allPreviousAssemblyChangesInsideDeclaredScopes':True,'repairsAreExactOldOrNewRgbaSelection':True,'nativeAlphaModified':False,'newLocalRepairs':[r['id'] for r in repairs],'nativeAssembledAlphaAudits':alpha,'mapPythonTestsPassed':30,'preservedExportRegressionTestsPassed':4,'eastUnderlayRegressionTestsPassed':3,'southUnderlayRegressionTestsPassed':3,'actualNativeReplacementViews':20,'reviewAtlasCount':len(regions),'browserErrors':browser['errors'],'legacyBaseCulling':cull,'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','remainingVisualCorrectionTiles':['r3c9','r4c9'],'visualCorrectionDebt':['Northeast approved corner cloud/road block and cyan20 shade phase require a whole native joint correction','Review southwest/southeast corner road phase, upper-cloud shading handoff and previous grass texture transitions'],'reviewScreenshotHashes':[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']],'referenceInputFilesHashed':[{'path':str(f.relative_to(m.ROOT)),'sha256':m.sha(f)} for f in sorted(refs.rglob('*')) if f.is_file()]}
approved=json.load(open(out/'approved-review-regions.json'));assert len(approved)==4 and browser['croppedApprovedRegions']==2
for r in approved:
 source=m.ROOT/'public/modern'/r['sourceUrl'];assert m.sha(source)==r['sourceSha256'];crop=r['nativeTopCropPixels'];assert crop==(139 if r['tileId'] in ['r0c0','r0c1'] else 0)
 if crop:
  src=Image.open(source).convert('RGBA');actual=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');assert np.array_equal(np.array(src.crop((0,crop,src.width,src.height))),np.array(actual));assert m.sha(m.ROOT/'public/modern'/r['url'])==r['outputSha256']
  assert abs(r['logicalRect'][1]-(420+crop/m.DENSITY))<1e-8
im=Image.open(out/'pilot-north-right-4x.png').convert('RGB');ghost=im.getpixel((320,372));sky=im.getpixel((500,375));assert max(abs(a-b) for a,b in zip(ghost,sky))<=2
v['approvedTopCropReviewOnly']={'removedNativeRows':139,'logicalBand':32,'replacedByExistingNativeContexts':True,'sourceFilesUnchanged':True,'retainedPixelsExactRgba':True,'afterGhostRgb':ghost,'skyRgb':sky,'beforeGhostRgb':[59,143,213],'beforeApprovedAlphaAtWorld1004_429':139,'nativeAlphaAtSamePoint':0}
ghostred=(m.CACHE/'batch19-approved-north-ghost-red.log').read_text();assert 'FAILED (failures=2)' in ghostred;shutil.copy2(m.CACHE/'batch19-approved-north-ghost-red.log',out/'batch19-approved-north-ghost-red.log')
v['approvedNorthGhostRegressionTestsPassed']=3
v['northUnderlayRegressionTestsPassed']=3;v['northUnderlayRedAlphaSamples']=[0,195];v['northUnderlayCornerOwnership']='West/east own32x32 corners; two224x32 native strips fill north middle without overlap'
red=(m.CACHE/'batch19-north-underlay-red.log').read_text();assert 'FAILED (failures=4)' in red and '195' in red;shutil.copy2(m.CACHE/'batch19-north-underlay-red.log',out/'batch19-north-underlay-red.log')
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['newEngineeringCandidates','counts','immutableAttemptMasterHashesVerified','actualNativeReplacementViews','browserErrors','productionEnabled']}))
