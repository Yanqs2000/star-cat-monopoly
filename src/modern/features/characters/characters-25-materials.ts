import aniu from '../../data/characters-25.json'
import guaika from '../../data/guaika-complete.json'
import weiwei from '../../data/weiwei-complete.json'
import ajie from '../../data/ajie-complete.json'
import nini from '../../data/nini-complete.json'

// Keep each identity independently reproducible. Rebuilding one pack cannot
// overwrite another accepted character's rig, portraits or activity clips.
export default {
 activeIds:[...aniu.activeIds,...guaika.activeIds,...weiwei.activeIds,...ajie.activeIds,...nini.activeIds],
 characters:[...aniu.characters,...guaika.characters,...weiwei.characters,...ajie.characters,...nini.characters],
 runtimeImages:[...new Map([...aniu.runtimeImages,...guaika.runtimeImages,...weiwei.runtimeImages,...ajie.runtimeImages,...nini.runtimeImages].map(p=>[p.url,p])).values()],
 assets:[...aniu.assets,...guaika.assets,...weiwei.assets,...ajie.assets,...nini.assets],
 activityClips:[...aniu.activityClips,...guaika.activityClips,...weiwei.activityClips,...ajie.activityClips,...nini.activityClips],
 thumbnailUrls:{...aniu.thumbnailUrls,...guaika.thumbnailUrls,...weiwei.thumbnailUrls,...ajie.thumbnailUrls,...nini.thumbnailUrls},
}
