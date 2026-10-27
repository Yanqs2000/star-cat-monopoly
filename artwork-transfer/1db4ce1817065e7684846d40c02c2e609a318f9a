import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
from hd_map_seams import native_alpha_audit
s=m.read();before=json.load(open(m.CACHE/'batch18-before/generation.json'));out=m.WORK/'reviews/batch-18';old={t['id']:t for t in before['tiles']}
new_ids=['r0c2','r0c3','r0c4','r0c5','r0c6','r0c7','r1c2','r1c5']
repairs=[r for r in s['repairs'] if r['id'] not in {a['id'] for a in before['repairs']}]
assert sorted(r['id'] for r in repairs)==['hospital-whole-surface-r2','north-grass-star-word-whole-r1']
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']=='e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653'
masters=0
for t in s['tiles']:
 for a in t['attempts']:
  assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
 for a in t.get('repairAttempts',[]):
  if 'masterPath' in a:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256']
 if m.is_ready(t) and t.get('assembledSha256'):assert m.sha(m.WORK/'assembled'/f"{t['id']}.png")==t['assembledSha256']
allowed={'r0c8':[[1872,0,32,180]],'r1c7':[[1632,180,240,32]],'r1c6':[[1392,180,240,32],[1392,180,32,240]],'r2c5':[[1152,420,240,32]],'r2c2':[[400,420,240,32]]}
for r in repairs:
 for t in before['tiles']:
  ax,ay,aw,ah=r['rect'];x,y,w,h=t['rect'];a,b=max(x,ax),max(y,ay);c,d=min(x+w,ax+aw),min(y+h,ay+ah)
  if a<c and b<d:allowed.setdefault(t['id'],[]).append([a,b,c-a,d-b])
protection=[]
for p in sorted((m.CACHE/'batch18-before/assembled').glob('*.png')):
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
for tid in ['r0c3','r0c2']:
 t=next(t for t in s['tiles'] if t['id']==tid);a=t['attempts'][-1];rx,ry,rw,rh=t['referenceRect'];x,y,w,h=t['rect']
 native=Image.open(m.ROOT/t['selectedMaster']).convert('RGBA').resize((m.px(rx+rw)-m.px(rx),m.py(ry+rh)-m.py(ry)),Image.Resampling.LANCZOS)
 expected=native.crop((m.px(x)-m.px(rx),m.py(y)-m.py(ry),m.px(x+w)-m.px(rx),m.py(y+h)-m.py(ry)))
 assert np.array_equal(np.array(expected),np.array(Image.open(m.WORK/'assembled'/f'{tid}.png').convert('RGBA')))
 source=np.array(original.crop((x,y,x+w,y+h)))[:,:,3];yy,xx=np.indices(source.shape);covered=(xx+x>=rx)&(xx+x<rx+rw)&(yy+y>=ry)&(yy+y<ry+rh)
 assert not source[~covered].any() and a['transparentCanvasPadding']['sourceNonzeroAlphaOutsideGeneratedReference']==0
regions=json.load(open(out/'regions.json'));grid=[r for r in regions if r['label']!='sign']
for r in regions:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r['sha256'] and Image.open(p).size==tuple(r['pixelSize'])
for i,a in enumerate(grid):
 for b in grid[i+1:]:
  ax,ay,aw,ah=a['logicalRect'];bx,by,bw,bh=b['logicalRect'];assert not(min(ax+aw,bx+bw)-max(ax,bx)>1e-7 and min(ay+ah,by+bh)-max(ay,by)>1e-7)
assert m.sha(m.CACHE/'batch18-before/assembled/r3c5.png')==m.sha(m.WORK/'assembled/r3c5.png')
browser=json.load(open(out/'native-alpha-browser-verification.json'));cull=browser['legacyBaseCulling']
assert not browser['errors'] and len(browser['views'])==19 and browser['regionCount']==len(regions)==106 and all(v['pending']==0 for v in browser['views'])
assert cull['url']=='/assets-hd/map.webp' and cull['pixelSize']==[5400,5104] and cull['logicalScale']==[2,2] and all(a==0 for a in cull['zeroAlphaSamples'])
for key in ['underlayZeroAlphaSamples','eastUnderlayZeroAlphaSamples','southUnderlayZeroAlphaSamples']:assert cull[key]==[0,0]
for name,counts in [('python-tests',[27,3]),('preserved-export-tests',[4]),('east-underlay-green',[3]),('south-underlay-green',[3])]:
 p=m.CACHE/f'batch18-{name}.log';content=p.read_text();assert 'FAILED' not in content and all(f'Ran {n} tests' in content for n in counts);shutil.copy2(p,out/p.name)
for name in ['formal-map-verification','static-protection-verification']:
 p=m.CACHE/f'batch18-{name}.json';shutil.copy2(p,out/(name+'.json'))
formal=json.load(open(out/'formal-map-verification.json'));static=json.load(open(out/'static-protection-verification.json'))
assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
counts={k:sum(t['status']==k for t in s['tiles']) for k in ['selected-engineering','pending','pending-visual-review','approved-source-reused']}
assert list(counts.values())==[101,0,4,4] and masters==190
for name in ['batch18-pack.py','batch18-native-alpha-review.mjs','batch18-register.py','batch18-accept-native.py','batch18-cloud-cap-reuse.py','batch18-audit.py','test_batch18_preserved_exports.py','test_batch18_east_underlay.py','test_batch18_south_underlay.py']:shutil.copy2(m.CACHE/name,out/name)
refs=m.WORK/'references/batch-18';refs.mkdir(exist_ok=True)
for folder in ['batch18-inputs','north-grass-star-word-whole-r1','hospital-whole-surface-r1','hospital-whole-surface-r2','northwest-whole-trees-r1']:shutil.copytree(m.CACHE/folder,refs/folder,dirs_exist_ok=True)
v={'date':'2026-10-22','completedImageGenerationCallsThisBatch':10,'nativeContextReusedCells':['r0c3','r0c2'],'newEngineeringCandidates':new_ids,'counts':counts,'immutableAttemptMasterHashesVerified':masters,'originalMapUnchanged':True,'approvedFourAssembliesByteIdentical':True,'allPreviousAssemblyChangesInsideDeclaredScopes':True,'repairsAreExactOldOrNewRgbaSelection':True,'nativeAlphaModified':False,'newLocalRepairs':[r['id'] for r in repairs],'nativeAssembledAlphaAudits':alpha,'mapPythonTestsPassed':30,'preservedExportRegressionTestsPassed':4,'eastUnderlayRegressionTestsPassed':3,'southUnderlayRegressionTestsPassed':3,'actualNativeReplacementViews':19,'reviewAtlasCount':len(regions),'browserErrors':browser['errors'],'legacyBaseCulling':cull,'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','remainingVisualCorrectionTiles':['r1c3','r1c4','r3c9','r4c9'],'visualCorrectionDebt':['Northwest cloud and hospital island retain abrupt old/new boundary until r1c3/r1c4 corrected','Rectangular shade differences remain in northwest and northeast crowns; repair whole trees together with neighboring cells','Review upper cloud shading handoff, north approved underlay, southwest/southeast corner phase and prior grass texture transitions'],'reviewScreenshotHashes':[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']],'referenceInputFilesHashed':[{'path':str(f.relative_to(m.ROOT)),'sha256':m.sha(f)} for f in sorted(refs.rglob('*')) if f.is_file()]}
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['newEngineeringCandidates','counts','immutableAttemptMasterHashesVerified','actualNativeReplacementViews','browserErrors','productionEnabled']}))
