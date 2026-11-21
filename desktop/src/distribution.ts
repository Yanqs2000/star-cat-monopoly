import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { extractFile, listPackage } from '@electron/asar'

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
function requireValue(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }

export function verifyDesktopPackage(resources: string, version: string) {
  const archive = path.join(resources, 'app.asar')
  const files = listPackage(archive, { isPack: false }).map(name => name.replaceAll('\\', '/'))
  const allowedAppRoots = new Set(['dist', 'node_modules', 'package.json'])
  for (const name of files) {
    const segments = name.split('/').filter(Boolean)
    requireValue(!segments.length || allowedAppRoots.has(segments[0]!), `应用包不应包含：${name}`)
    requireValue(!segments.some(s => ['.mcp.json', '.claude', '.data', '.analysis-cache', '.DS_Store'].includes(s)) && !/\.sqlite(?:-wal|-shm)?$/i.test(name), `应用包不应包含：${name}`)
  }
  const pkg = JSON.parse(extractFile(archive, 'package.json').toString()) as { name: string; version: string; main: string; dependencies: Record<string, string> }
  requireValue(pkg.name === 'star-cat-monopoly-desktop', '应用包标识错误')
  requireValue(pkg.version === version, '安装包版本不一致')
  requireValue(typeof pkg.main === 'string' && files.includes('/' + pkg.main), '应用入口缺失')
  for (const name of Object.keys(pkg.dependencies)) requireValue(files.includes(`/node_modules/${name}/package.json`), `缺少应用依赖：${name}`)

  const game = path.join(resources, 'game')
  const allowedGameRoots = new Set(['modern.html', 'assets', 'assets-hd', 'hd-map', 'hd-static', 'hd-characters'])
  function walk(directory: string, prefix = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name
      const segments = relative.split('/')
      requireValue(allowedGameRoots.has(segments[0]!) && !segments.some(s => ['.mcp.json', '.claude', '.data', '.DS_Store'].includes(s)) && !/\.(?:sqlite(?:-wal|-shm)?|blend)$/i.test(relative) && !entry.isSymbolicLink(), `游戏资源不应包含：${relative}`)
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative + '/')
    }
  }
  walk(game)
  for (const relative of ['modern.html', 'hd-map/full-map-v1/manifest.json', 'hd-static', 'hd-characters']) {
    const filename = path.join(game, relative)
    requireValue(existsSync(filename), `缺少运行资源：${relative}`)
    requireValue(statSync(filename).isDirectory() ? readdirSync(filename).length > 0 : statSync(filename).size > 0, `空运行资源：${relative}`)
  }
  const base = path.join(game, 'assets-hd')
  const profile = JSON.parse(readFileSync(path.join(base, 'hd-profile.json'), 'utf8'))
  requireValue(profile.version === 1 && profile.profile === 'hd' && profile.pixelDensity === 2 && profile.manifest === 'hd-manifest.json' && Number.isSafeInteger(profile.assetCount) && profile.assetCount > 0 && profile.assetCount === profile.sourceAssetCount, '高清配置错误')
  const manifestBytes = readFileSync(path.join(base, profile.manifest))
  requireValue(sha256(manifestBytes) === profile.manifestSha256, '高清清单校验失败')
  const manifest = JSON.parse(manifestBytes.toString()) as { files: Array<{ path: string; outputSha256: string }> }
  requireValue(manifest.files.length === profile.assetCount && new Set(manifest.files.map(f => f.path)).size === manifest.files.length, '高清清单数量错误')
  let bytes = 0
  for (const item of manifest.files) {
    const filename = path.resolve(game, item.path)
    requireValue(item.path.startsWith('assets-hd/') && !item.path.split('/').includes('..') && filename.startsWith(base + path.sep), `非法高清路径：${item.path}`)
    requireValue(existsSync(filename), `缺少高清纹理：${item.path}`)
    const content = readFileSync(filename)
    requireValue(sha256(content) === item.outputSha256, `高清纹理校验失败：${item.path}`)
    bytes += content.length
  }
  requireValue(bytes === profile.totalBytes, '高清纹理总字节数错误')
  return { version: pkg.version, hdTextureCount: manifest.files.length, hdTextureBytes: bytes }
}
