import sys,json,shutil
from PIL import Image
import numpy as np
sys.path.insert(0,'scripts');import produce_hd_map as m
sys.path.insert(0,str(m.CACHE));from test_batch21_ne_reuse import native_approved
from hd_map_seams import native_alpha_audit
s=m.read();out=m.WORK/'reviews/batch-21';before=json.loads((m.CACHE/'batch21-before/generation.json').read_text())
assert m.sha(m.ROOT/'public/modern/assets/map.png')==s['sourceMapSha256']=='e95bc2626fa2b1b89cdb8d52e84fbb69153aa97aebaeb2cedf5b5f3a34556653'
assert [r['id'] for r in s['repairs']]==[r['id'] for r in before['repairs']]
masters=0
for t in s['tiles']:
 for a in t['attempts']:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256'];masters+=1
 for a in t.get('repairAttempts',[]):
  if 'masterPath' in a:assert m.sha(m.ROOT/a['masterPath'])==a['masterSha256']
 p=m.WORK/'assembled'/f"{t['id']}.png";assert m.sha(p)==m.sha(m.CACHE/'batch21-before/assembled'/p.name)
 assert m.sha(p)==t['assembledSha256']
for r in s['repairs']:
 for f in r['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
assert masters==192
rows=json.loads((out/'regions.json').read_text());prior=json.loads((m.WORK/'reviews/batch-20/regions.json').read_text());by={r['label']:r for r in prior}
assert len(rows)==111
for r in rows:
 p=m.ROOT/'public/modern'/r['url'];assert m.sha(p)==r['sha256'] and Image.open(p).size==tuple(r['pixelSize'])
 if r['label'] not in ['r2c5','r2c4-cyan10-underlay']:assert r['sha256']==by[r['label']]['sha256'],r['label']
grid=[r for r in rows if r['label']!='sign']
for i,a in enumerate(grid):
 for b in grid[i+1:]:
  ax,ay,aw,ah=a['logicalRect'];bx,by,bw,bh=b['logicalRect'];assert not(min(ax+aw,bx+bw)-max(ax,bx)>1e-7 and min(ay+ah,by+bh)-max(ay,by)>1e-7)
folder=m.WORK/'native-reuse/northeast-corner-v1';sources=json.loads((folder/'sources.json').read_text())
for f in sources['files'].values():assert m.sha(m.ROOT/f['path'])==f['sha256']
for name in ['sourceOldAtlas','sourceNorthMaster']:assert m.sha(m.ROOT/sources[name]['path'])==sources[name]['sha256']
old=np.array(Image.open(folder/'old.png').convert('RGBA'));north=np.array(Image.open(folder/'north.png').convert('RGBA'));mask=np.array(Image.open(folder/'mask.png'))>0;assembled=np.array(Image.open(folder/'assembled.png').convert('RGBA'))
assert np.array_equal(np.where(mask[:,:,None],north,old),assembled)
rawold=Image.open(m.ROOT/sources['sourceOldAtlas']['path']).convert('RGBA').crop(tuple(sources['sourceOldAtlas']['pixelCrop']));assert np.array_equal(np.array(rawold),old)
nx,ny,nw,nh=sources['sourceNorthMaster']['referenceRect'];raw=Image.open(m.ROOT/sources['sourceNorthMaster']['path']).convert('RGBA').resize((m.px(nx+nw)-m.px(nx),m.py(ny+nh)-m.py(ny)),Image.Resampling.LANCZOS);part=raw.crop((m.px(1120)-m.px(nx),m.py(420)-m.py(ny),m.px(1152)-m.px(nx),m.py(452)-m.py(ny)));assert np.array_equal(np.array(part),north)
assert not mask[m.py(440):,m.px(1136)-m.px(1120):].any();alpha=native_alpha_audit(Image.fromarray(assembled));stats=sources['stats'];assert stats['meanRgbDifference']<=12 and stats['p95RgbDifference']<=40
native=native_approved([1056,472,96,64]);assert native.getchannel('A').getextrema()==(255,255)
original=Image.open(m.ROOT/'public/modern/assets/map.png').convert('RGBA');assert original.crop((1056,472,1152,536)).getchannel('A').getextrema()==(255,255);assert original.getpixel((1124,430))[3]==0
approved=json.loads((out/'approved-review-regions.json').read_text());assert len(approved)==5 and {r['sourceTileId'] for r in approved}=={'r0c0','r0c1','r1c0','r1c1'}
for r in approved:
 src=Image.open(m.ROOT/'public/modern'/r['sourceUrl']).convert('RGBA');assert m.sha(m.ROOT/'public/modern'/r['sourceUrl'])==r['sourceSha256'];dst=Image.open(m.ROOT/'public/modern'/r['url']).convert('RGBA');assert np.array_equal(np.array(src.crop(tuple(r['nativePixelCrop']))),np.array(dst));assert m.sha(m.ROOT/'public/modern'/r['url'])==r['outputSha256']
parts=[r for r in approved if r['sourceTileId']=='r0c1'];assert len(parts)==2
assert {tuple(r['nativePixelCrop']) for r in parts}=={(0,139,980,261),(0,261,1119,1119)}
browser=json.loads((out/'native-alpha-browser-verification.json').read_text());assert len(browser['views'])==23 and not browser['errors'] and browser['regionCount']==111 and all(v['pending']==0 for v in browser['views'])
cull=browser['legacyBaseCulling'];assert cull['url']=='/assets-hd/map.webp' and cull['logicalScale']==[2,2] and cull['pixelSize']==[5400,5104] and not any(cull['zeroAlphaSamples'])
for key in ['underlayZeroAlphaSamples','eastUnderlayZeroAlphaSamples','southUnderlayZeroAlphaSamples','northUnderlayZeroAlphaSamples']:assert cull[key]==[0,0]
for name,counts in [('python-tests',[27,3]),('preserved-export-tests',[4]),('east-underlay-green',[3]),('south-underlay-green',[3]),('north-underlay-green',[3]),('approved-north-ghost-green',[3]),('ne-reuse-green',[8])]:
 p=m.CACHE/f'batch21-{name}.log';text=p.read_text();assert 'FAILED' not in text and all(f'Ran {n} tests' in text for n in counts);shutil.copy2(p,out/p.name)
for name in ['ne-reuse-red','green30-phase-red','green30-overlay-red','east-lower-preservation-red']:shutil.copy2(m.CACHE/f'batch21-{name}.log',out/f'batch21-{name}.log')
assert 'FAILED (failures=3)' in (m.CACHE/'batch21-ne-reuse-red.log').read_text();assert 'FAILED (failures=1)' in (m.CACHE/'batch21-green30-phase-red.log').read_text();assert 'FAILED (failures=2)' in (m.CACHE/'batch21-green30-overlay-red.log').read_text()
for name in ['formal-map-verification','static-protection-verification']:shutil.copy2(m.CACHE/f'batch21-{name}.json',out/(name+'.json'))
formal=json.loads((out/'formal-map-verification.json').read_text());static=json.loads((out/'static-protection-verification.json').read_text());assert formal['approvedRuntimeTiles']==4 and static['protectedFilesUnchanged']==81 and static['installedPaths']==211 and static['installedJobs']==142
for name in ['batch21-pack.py','batch21-native-alpha-review.mjs','batch21-ne-corner-cut.py','batch21-audit.py','test_batch21_ne_reuse.py','test_batch21_preserved_exports.py','test_batch21_east_underlay.py','test_batch21_south_underlay.py','test_batch21_north_underlay.py','test_batch21_approved_north_ghost.py']:shutil.copy2(m.CACHE/name,out/name)
refs=m.WORK/'references/batch-21';refs.mkdir(exist_ok=True);shutil.copytree(m.CACHE/'batch21-inputs',refs/'inputs',dirs_exist_ok=True)
native.save(refs/'cyan10-full-native-source.png')
counts={k:sum(t['status']==k for t in s['tiles']) for k in ['selected-engineering','pending','pending-visual-review','approved-source-reused']};assert list(counts.values())==[105,0,0,4]
im=Image.open(out/'pilot-north-east-corner-4x.png').convert('RGB');probe=im.getpixel((288,440));assert max(abs(a-b) for a,b in zip(probe,[102,204,255]))<=2
v={'date':'2026-10-22','completedImageGenerationCallsThisBatch':0,'newEngineeringCandidates':[],'counts':counts,'immutableAttemptMasterHashesVerified':masters,'all109WorkingAssembliesByteIdentical':True,'allPriorRepairFilesUnchanged':True,'originalMapUnchanged':True,'approvedFourFilesUnchanged':True,'nativeCornerRgbaSelectionExact':True,'cornerAlphaAudit':alpha,'cornerCutStats':stats,'nativeRoadReuseSourceAlpha':[255,255],'nativeRoadApprovedVisibleRgbMatched':True,'reviewAtlasCount':111,'actualNativeReplacementViews':23,'browserErrors':browser['errors'],'legacyBaseCulling':cull,'skyProbeBeforeRgb':[1,140,252],'skyProbeAfterRgb':probe,'skyReferenceRgb':[102,204,255],'numericLabelCorrection':'This is cyan10 in original and approved native art; previous cyan20 task label was wrong. No numeral changed.','green30ProtectedRects':[[1136,440,16,12],[1136,472,16,8]],'approvedReviewGeometryCrop':{'topNativeRows':139,'rightNativeColumnsForGreen30Band':139,'green30BandNativeRows':[139,261],'lowerFieldFullWidthPreserved':True,'sourceFilesUnchanged':True,'retainedRgbaExact':True},'mapPythonTestsPassed':30,'preservedExportRegressionTestsPassed':4,'eastSouthNorthUnderlayTestsPassed':9,'approvedNorthGhostRegressionTestsPassed':3,'northeastNativeReuseRegressionTestsPassed':8,'formalMapVerification':formal,'staticProtectionVerification':static,'productionEnabled':False,'fullMapUserAcceptance':'incomplete','reviewScreenshotHashes':[{'view':x['name'],'sha256':m.sha(out/(x['name']+'.png'))} for x in browser['views']],'referenceInputFilesHashed':[{'path':str(f.relative_to(m.ROOT)),'sha256':m.sha(f)} for f in sorted(refs.rglob('*')) if f.is_file()]}
(out/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v[k] for k in ['completedImageGenerationCallsThisBatch','counts','all109WorkingAssembliesByteIdentical','actualNativeReplacementViews','skyProbeAfterRgb','productionEnabled']}))
