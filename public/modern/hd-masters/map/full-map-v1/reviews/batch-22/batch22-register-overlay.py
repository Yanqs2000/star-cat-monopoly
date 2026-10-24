import sys,json,shutil
from PIL import Image
sys.path.insert(0,'scripts');import produce_hd_map as m
rid=sys.argv[1];cache=m.CACHE/rid;g=json.load(open(cache/'generation.json'));ev=json.load(open(cache/'evaluation.json'));assert ev['passed'];s=m.read();assert not any(r['id']==rid for r in s['repairs']);folder=m.WORK/'repairs'/rid;folder.mkdir()
for src,dst in [('before.png','before.png'),('layout.png','layout.png'),('mask.png','mask.png'),('assembled-candidate.png','assembled.png'),('evaluation.json','evaluation.json'),('generation.json','generation.json')]:shutil.copy2(cache/src,folder/dst)
shutil.copy2(g['path'],folder/'master.png');names=['before.png','layout.png','mask.png','assembled.png','master.png','evaluation.json','generation.json'];files={n:{'path':str((folder/n).relative_to(m.ROOT)),'sha256':m.sha(folder/n)} for n in names}
s['repairs'].append({'id':rid,'rect':g['rect'],'generator':'built-in image_gen','prompt':g['prompt'],'nativePixelSize':ev['nativePixelSize'],'nativePixelDensity':min(ev['nativePixelSize'][0]/g['rect'][2],ev['nativePixelSize'][1]/g['rect'][3]),'method':'Whole opaque scene correction, exact old or new RGBA hard selection only','files':files,'seams':ev['seams'],'affectedTiles':[],'applied':False,'reviewOverlayAfterApproved':True,'productionEnabled':False,'reviewStatus':'pending-actual-render-review'})
s['partialReviewRegions'].append({'repairId':rid,'rect':g['rect'],'assembledPath':str((folder/'assembled.png').relative_to(m.ROOT)),'exportRects':[],'scope':'Separate opaque review overlay after approved drawing; keep all working assemblies unchanged'})
m.save(s);print('Registered review-only',rid)
