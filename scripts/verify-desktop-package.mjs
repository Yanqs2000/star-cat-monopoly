import { verifyDesktopPackage } from '../desktop/src/distribution.ts'
import { readFile } from 'node:fs/promises'
const resources = process.argv[2]
if (!resources) throw new Error('Usage: node scripts/verify-desktop-package.mjs <installed Resources directory>')
const pkg = JSON.parse(await readFile(new URL('../desktop/package.json', import.meta.url), 'utf8'))
console.log(JSON.stringify(verifyDesktopPackage(resources, pkg.version), null, 2))
