import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, readdir, writeFile, access, rm } from 'node:fs/promises'
import path from 'node:path'
import { smokeDesktop } from './desktop-smoke.mjs'
import pkg from '../desktop/package.json' with { type: 'json' }

const [input, output] = process.argv.slice(2)
if (!input || !output) throw new Error('Usage: test-desktop-installer <dmg or setup.exe> <evidence directory>')
const installer = path.resolve(input), evidence = path.resolve(output)
const platform = process.platform === 'darwin' ? 'mac' : 'win'
const expectedName = `StarCatMonopoly-${pkg.version}-${platform}-${process.arch}${process.platform === 'darwin' ? '.dmg' : '-setup.exe'}`
if (path.basename(installer) !== expectedName) throw new Error(`Installer target mismatch: expected ${expectedName}`)
await mkdir(evidence, { recursive: true })
const installed = path.join(evidence, 'installed app')
await mkdir(installed, { recursive: true })
let executable, resources
async function install() {
if (process.platform === 'darwin') {
  const mount = path.join(evidence, 'dmg-mount')
  await mkdir(mount, { recursive: true })
  execFileSync('hdiutil', ['attach', '-nobrowse', '-readonly', '-mountpoint', mount, installer], { stdio: 'inherit' })
  try {
    const bundle = (await readdir(mount)).find(name => name.endsWith('.app'))
    if (!bundle) throw new Error('DMG contains no application')
    const destination = path.join(installed, bundle)
    try { await access(destination); execFileSync('chmod', ['-R', 'u+w', destination]) } catch {}
    execFileSync('ditto', [path.join(mount, bundle), destination])
    execFileSync('codesign', ['--verify', '--deep', '--strict', destination])
    executable = path.join(destination, 'Contents/MacOS/StarCatMonopoly')
    resources = path.join(destination, 'Contents/Resources')
    execFileSync('chmod', ['-R', 'a-w', destination])
  } finally { execFileSync('hdiutil', ['detach', mount], { stdio: 'inherit' }) }
} else if (process.platform === 'win32') {
  const result = spawnSync(installer, ['/S', `/D=${installed}`], { windowsVerbatimArguments: true, timeout: 180000, stdio: 'inherit' })
  if (result.error || result.status !== 0) throw result.error ?? new Error(`NSIS install exited ${result.status}`)
  executable = path.join(installed, 'StarCatMonopoly.exe')
  resources = path.join(installed, 'resources')
} else throw new Error('Only native macOS and Windows installation tests are supported')
}

await install()
await access(executable)
const { savedState, ...result } = await smokeDesktop(executable, resources, evidence)
await install()
const overwrite = await smokeDesktop(executable, resources, evidence, savedState)
if (process.platform === 'win32') {
  const uninstaller = (await readdir(installed)).find(name => /^Uninstall.*\.exe$/i.test(name))
  if (!uninstaller) throw new Error('Installed app has no uninstaller')
  const result = spawnSync(path.join(installed, uninstaller), ['/S'], { timeout: 120000, stdio: 'inherit' })
  if (result.error || result.status !== 0) throw result.error ?? new Error(`NSIS uninstall exited ${result.status}`)
  for (let i = 0; i < 100; i++) {
    try { await access(executable) } catch { break }
    if (i === 99) throw new Error('Uninstaller left the application executable')
    await new Promise(resolve => setTimeout(resolve, 200))
  }
} else {
  execFileSync('chmod', ['-R', 'u+w', installed])
  await rm(installed, { recursive: true, force: true })
}
await access(path.join(evidence, 'user-data/saves.sqlite'))
await writeFile(path.join(evidence, 'installer.json'), JSON.stringify({ installer: path.basename(installer), method: process.platform === 'darwin' ? 'DMG mounted, app copied and signature verified; app resources read-only' : 'NSIS silent installation', installedVerified: true, overwritePreserved: overwrite.overwritePreserved, removedAppPreservedSave: true, ...result }, null, 2))
console.log('Native installer and restart verification passed')
