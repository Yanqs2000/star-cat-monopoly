import { prepareReleaseAssets } from '../desktop/src/release.ts'
import pkg from '../desktop/package.json' with { type: 'json' }
const [directory, source = process.env.STAR_CAT_SOURCE_COMMIT] = process.argv.slice(2)
if (!directory || !source) throw new Error('Usage: release-checksums <downloaded artifacts> <source SHA>')
console.log(JSON.stringify(await prepareReleaseAssets(directory, pkg.version, source), null, 2))
