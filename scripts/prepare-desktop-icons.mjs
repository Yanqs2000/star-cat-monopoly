import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

if (process.platform !== 'darwin') throw new Error('Regenerate icons on macOS; committed icons are used for Windows builds.')
const root = fileURLToPath(new URL('../', import.meta.url))
const source = path.join(root, 'public/modern/assets/ui/emblem.png')
const icons = path.join(root, 'desktop/icons')
const iconset = path.join(icons, 'generated/app.iconset')
await mkdir(iconset, { recursive: true })
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    execFileSync('sips', ['-z', String(size * scale), String(size * scale), source, '--out', path.join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`)], { stdio: 'ignore' })
  }
}
execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(icons, 'icon.icns')])
execFileSync('sips', ['-z', '256', '256', source, '--out', path.join(icons, 'icon.png')], { stdio: 'ignore' })
const png = await readFile(path.join(icons, 'icon.png'))
const header = Buffer.alloc(22)
header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4)
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12)
header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18)
await writeFile(path.join(icons, 'icon.ico'), Buffer.concat([header, png]))
await rm(path.join(icons, 'generated'), { recursive: true, force: true })
console.log('Platform icons converted from the existing game emblem.')
