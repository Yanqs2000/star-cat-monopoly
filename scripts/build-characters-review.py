from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
out=R/'public/hd-review/characters-22-24';out.mkdir(parents=True,exist_ok=True)
world=json.loads((R/'public/modern/assets/world/manifest.json').read_text())
activities=json.loads((R/'public/modern/assets/activities/manifest.json').read_text())
aliases=json.loads((R/'src/modern/data/animation-frame-aliases.json').read_text())
def compact(clip):
 clip=json.loads(json.dumps(clip))
 for f in clip['frames']:
  prefix,filename=f['url'].rsplit('/',1);index=int(filename.split('.')[0])
  if prefix in aliases:f['url']=prefix+'/'+str(aliases[prefix][index-1])+'.png'
 return clip
data={'world':[compact(c)for c in world['clips']if c['id']in ['npc-'+str(n)for n in [2,3,4,5,9,10,11,12,13,14,15]]],
 'activities':[compact(c)for c in activities['clips']if c['id']in ['mini-npc-'+str(n)for n in [2,3,4,5,9,10,11,12,13,14,15]]+['trait-'+str(n)for n in [9,12,13,14,15,23]]]}
(out/'original.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
