import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import pkg from '../desktop/package.json' with { type: 'json' }
const [evidence, destination = 'ci-artifacts'] = process.argv.slice(2)
if (!evidence) throw new Error('Usage: stage-desktop-artifacts <verified evidence> [destination]')
await mkdir(destination, { recursive: true })
const name = `StarCatMonopoly-${pkg.version}-${process.platform === 'darwin' ? 'mac-' + process.arch + '.dmg' : 'win-' + process.arch + '-setup.exe'}`
await copyFile(path.join('release', name), path.join(destination, name))
for (const name of ['report.json', 'installer.json', 'overwrite-report.json', 'installed-save.png', 'installed-restarted-game.png', 'installed-after-overwrite.png']) await copyFile(path.join(evidence, name), path.join(destination, name))
