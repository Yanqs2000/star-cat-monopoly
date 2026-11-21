import { afterEach, expect, it } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { isAppNavigation, resolveGameRoot, resolveSavePath, startDesktopServer } from '../../desktop/src/runtime'
import { createGame } from '../../src/modern/features/game/setup'
import { createSnapshot } from '../../src/modern/features/saves/snapshot'

const dirs: string[] = []
const servers: Array<{ close(): Promise<void> }> = []
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'star-cat-desktop-'))
  dirs.push(root)
  const staticRoot = path.join(root, 'read-only-app', 'game')
  mkdirSync(staticRoot, { recursive: true })
  writeFileSync(path.join(staticRoot, 'modern.html'), '<h1>fixture-game</h1>')
  return { staticRoot, userData: path.join(root, 'user-data'), root }
}
afterEach(async () => { for (const s of servers.splice(0)) await s.close(); for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

it('存档默认位于稳定用户目录，显式覆盖可移到自定义位置', () => {
  const { userData, root } = fixture()
  expect(resolveSavePath(userData)).toBe(path.join(userData, 'saves.sqlite'))
  expect(resolveSavePath(userData, '')).toBe(path.join(userData, 'saves.sqlite'))
  expect(resolveSavePath(userData, path.join(root, 'custom.sqlite'))).toBe(path.join(root, 'custom.sqlite'))
})

it('开发运行从项目构建目录读游戏，安装版从只读应用 resources 读游戏', () => {
  const { root } = fixture()
  const compiledDir = path.join(root, 'project', 'desktop', 'dist')
  const resources = path.join(root, 'installed-app', 'Resources')
  expect(resolveGameRoot(false, resources, compiledDir)).toBe(path.join(root, 'project', 'dist-modern'))
  expect(resolveGameRoot(true, resources, compiledDir)).toBe(path.join(resources, 'game'))
})

it.each([
  ['http://127.0.0.1:41234/modern.html', true],
  ['http://127.0.0.1:41234/modern.html?view=1#game', true],
  ['http://127.0.0.1:41235/modern.html', false],
  ['http://localhost:41234/modern.html', false],
  ['http://127.0.0.1.evil.test:41234/', false],
  ['http://user:secret@127.0.0.1:41234/modern.html', false],
  ['https://example.com/', false],
  ['file:///etc/passwd', false],
  ['javascript:alert(1)', false],
  ['not a URL', false],
])('窗口导航 %s 的允许结果为 %s', (url, allowed) => {
  expect(isAppNavigation(url as string, 'http://127.0.0.1:41234')).toBe(allowed)
})

it('服务使用各自空闲本地端口，关闭重开后读取相同 SQLite，保留 CSRF 与来源限制', async () => {
  const files = fixture()
  const first = await startDesktopServer(files)
  servers.push(first)
  const otherFiles = fixture()
  const other = await startDesktopServer(otherFiles)
  servers.push(other)
  expect(new URL(first.origin).hostname).toBe('127.0.0.1')
  expect(first.origin).not.toBe(other.origin)
  expect(await (await fetch(first.origin + '/modern.html')).text()).toContain('fixture-game')
  expect(existsSync(path.join(files.staticRoot, 'saves.sqlite'))).toBe(false)
  expect(existsSync(resolveSavePath(files.userData))).toBe(true)
  expect((await fetch(first.origin + '/api/saves')).status).toBe(403)
  expect((await fetch(first.origin + '/api/session', { headers: { origin: 'https://evil.test' } })).status).toBe(403)
  const session = await fetch(first.origin + '/api/session')
  const { csrfToken } = await session.json() as { csrfToken: string }
  const headers = { cookie: session.headers.get('set-cookie')!.split(';')[0]!, origin: first.origin, 'x-csrf-token': csrfToken, 'content-type': 'application/json' }
  const game = createGame([1], 102)
  game.tickets[1] = -100
  const stamp = '2026-11-03T04:00:00.000Z'
  const snapshot = createSnapshot(game, [1], { speed: 1, paused: true }, stamp, stamp)
  const payload = JSON.stringify({ expectedRevision: 0, requestId: 'desktop-save-1', snapshot })
  expect((await fetch(first.origin + '/api/saves/1', { method: 'PUT', headers: { ...headers, 'x-csrf-token': 'invalid' }, body: payload })).status).toBe(403)
  expect((await fetch(first.origin + '/api/saves/1', { method: 'PUT', headers, body: payload })).status).toBe(200)
  await first.close()
  await first.close()
  const reopened = await startDesktopServer(files)
  servers.push(reopened)
  const next = await fetch(reopened.origin + '/api/session')
  const token = await next.json() as { csrfToken: string }
  const read = await fetch(reopened.origin + '/api/saves/1', { headers: { cookie: next.headers.get('set-cookie')!.split(';')[0]!, 'x-csrf-token': token.csrfToken } })
  expect(read.status).toBe(200)
  expect(await read.json()).toMatchObject({ revision: 1, snapshot: { state: { tickets: { 1: -100 }, rngState: game.rngState } } })
})
