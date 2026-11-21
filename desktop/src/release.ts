import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export async function prepareReleaseAssets(directory: string, version: string, sourceCommit: string) {
  if (!/^[a-f0-9]{40}$/.test(sourceCommit) || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) throw new Error('版本或来源提交无效')
  const files: string[] = []
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('构建附件不允许符号链接')
      const filename = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(filename)
      else files.push(filename)
    }
  }
  await walk(directory)
  const targets = [
    { suffix: 'mac-arm64.dmg', platform: 'darwin', arch: 'arm64' },
  ]
  const selected = []
  const textureCounts = new Set(), textureBytes = new Set()
  for (const target of targets) {
    const name = `StarCatMonopoly-${version}-${target.suffix}`
    const matches = files.filter(filename => path.basename(filename) === name)
    if (matches.length !== 1) throw new Error(`缺少或重复平台包：${name}`)
    const filename = matches[0]!, size = (await stat(filename)).size
    if (size <= 0 || size >= 2 * 1024 ** 3) throw new Error(`附件必须非空且小于 2 GiB：${name}`)
    const report = JSON.parse(await readFile(path.join(path.dirname(filename), 'installer.json'), 'utf8'))
    if (report.sourceCommit !== sourceCommit || report.version !== version || report.runtime?.platform !== target.platform || report.runtime?.arch !== target.arch) throw new Error(`构建来源、版本或架构不一致：${name}`)
    if (![report.runtime?.packaged, report.installedVerified, report.overwritePreserved, report.removedAppPreservedSave, report.saveRestartPreserved, report.rollVerified, report.serverStopped].every(value => value === true) || report.defaultProfile !== 'hd' || ![report.errors, report.failedResponses, report.consoleErrors].every(value => Array.isArray(value) && value.length === 0)) throw new Error(`缺少成功的安装验证：${name}`)
    if (!Number.isSafeInteger(report.hdTextureCount) || report.hdTextureCount < 1 || !Number.isSafeInteger(report.hdTextureBytes) || report.hdTextureBytes < 1) throw new Error(`高清验证不完整：${name}`)
    textureCounts.add(report.hdTextureCount); textureBytes.add(report.hdTextureBytes)
    selected.push({ name, filename, size })
  }
  if (textureCounts.size !== 1 || textureBytes.size !== 1) throw new Error('各平台高清资源不一致')
  const assets = []
  for (const item of selected) {
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(item.filename)) hash.update(chunk)
    assets.push({ ...item, sha256: hash.digest('hex') })
  }
  const checksumPath = path.join(directory, 'SHA256SUMS.txt')
  await writeFile(checksumPath, assets.map(a => `${a.sha256}  ${a.name}`).join('\n') + '\n')
  return { assets, checksumPath }
}
