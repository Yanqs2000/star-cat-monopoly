import { afterEach, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createPackage } from '@electron/asar'
import { verifyDesktopPackage } from '../../desktop/src/distribution'

const dirs: string[] = []
const version = '0.2.0-beta.1'
const digest = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')
function put(root: string, name: string, value: string | Buffer) { const file = path.join(root, name); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, value) }
async function fixture(options: { appExtra?: string; gameExtra?: string; texturePath?: string } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'star-cat-distribution-'))
  dirs.push(root)
  const app = path.join(root, 'app'), resources = path.join(root, 'Resources'), game = path.join(resources, 'game')
  put(app, 'dist/main.cjs', 'console.log("desktop entry")')
  const dependencies = { '@fastify/cookie': '11.1.2', '@fastify/static': '10.1.5', ajv: '8.20.0', fastify: '5.12.5' }
  put(app, 'package.json', JSON.stringify({ name: 'star-cat-monopoly-desktop', version, main: 'dist/main.cjs', dependencies }))
  for (const name of Object.keys(dependencies)) put(app, `node_modules/${name}/package.json`, JSON.stringify({ name }))
  if (options.appExtra) put(app, options.appExtra, 'private')
  mkdirSync(resources, { recursive: true })
  await createPackage(app, path.join(resources, 'app.asar'))
  put(game, 'modern.html', '<script type="module" src="/assets/game.js"></script>')
  put(game, 'assets/game.js', 'console.log("game")')
  put(game, 'hd-map/full-map-v1/manifest.json', '{}')
  put(game, 'hd-static/example.webp', 'static')
  put(game, 'hd-characters/example.webp', 'character')
  put(game, 'assets-hd/example.webp', 'abc')
  const manifest = JSON.stringify({ files: [{ path: options.texturePath ?? 'assets-hd/example.webp', outputSha256: digest('abc') }] })
  put(game, 'assets-hd/hd-manifest.json', manifest)
  put(game, 'assets-hd/hd-profile.json', JSON.stringify({ version: 1, profile: 'hd', pixelDensity: 2, manifest: 'hd-manifest.json', assetCount: 1, sourceAssetCount: 1, totalBytes: 3, manifestSha256: digest(manifest) }))
  if (options.gameExtra) put(game, options.gameExtra, 'private')
  return { root, resources, game }
}
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

it('验证真实 ASAR 入口/依赖与高清文件，返回可记录的包版本和纹理字节数', async () => {
  const { resources } = await fixture()
  expect(verifyDesktopPackage(resources, version)).toMatchObject({ version, hdTextureCount: 1, hdTextureBytes: 3 })
})
it('缺失或损坏的高清纹理阻止交付', async () => {
  const { resources, game } = await fixture()
  put(game, 'assets-hd/example.webp', 'changed')
  expect(() => verifyDesktopPackage(resources, version)).toThrow(/高清纹理校验失败/)
  rmSync(path.join(game, 'assets-hd/example.webp'))
  expect(() => verifyDesktopPackage(resources, version)).toThrow(/缺少高清纹理/)
})
it('高清清单不匹配、非法目录逃逸和版本不一致阻止交付', async () => {
  const one = await fixture()
  put(one.game, 'assets-hd/hd-manifest.json', '{}')
  expect(() => verifyDesktopPackage(one.resources, version)).toThrow(/高清清单校验失败/)
  const two = await fixture({ texturePath: 'assets-hd/../../outside.webp' })
  expect(() => verifyDesktopPackage(two.resources, version)).toThrow(/非法高清路径/)
  const three = await fixture()
  expect(() => verifyDesktopPackage(three.resources, '0.3.0')).toThrow(/版本不一致/)
})
it.each(['.mcp.json', '.claude/skills/private.md', 'hd-masters/source.blend', 'assets/saves.sqlite'])('游戏资源不允许混入 %s', async gameExtra => {
  const { resources } = await fixture({ gameExtra })
  expect(() => verifyDesktopPackage(resources, version)).toThrow(/不应包含/)
})
it('ASAR 不允许混入原始源码或个人配置', async () => {
  for (const appExtra of ['src/secret.ts', '.mcp.json']) {
    const { resources } = await fixture({ appExtra })
    expect(() => verifyDesktopPackage(resources, version)).toThrow(/应用包不应包含/)
  }
})
