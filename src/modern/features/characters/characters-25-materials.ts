import aniu from '../../data/characters-25.json'
import guaika from '../../data/guaika-complete.json'
import weiwei from '../../data/weiwei-complete.json'

// Keep each identity independently reproducible. Rebuilding one pack cannot
// overwrite another accepted character's rig, portraits or activity clips.
export default {
 activeIds:[...aniu.activeIds,...guaika.activeIds,...weiwei.activeIds],
 characters:[...aniu.characters,...guaika.characters,...weiwei.characters],
 runtimeImages:[...new Map([...aniu.runtimeImages,...guaika.runtimeImages,...weiwei.runtimeImages].map(p=>[p.url,p])).values()],
 assets:[...aniu.assets,...guaika.assets,...weiwei.assets],
 activityClips:[...aniu.activityClips,...guaika.activityClips,...weiwei.activityClips],
 thumbnailUrls:{...aniu.thumbnailUrls,...guaika.thumbnailUrls,...weiwei.thumbnailUrls},
}
