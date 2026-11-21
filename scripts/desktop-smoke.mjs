import { _electron, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { verifyDesktopPackage } from '../desktop/src/distribution.ts'
import pkg from '../desktop/package.json' with { type: 'json' }

export async function smokeDesktop(executable, resources, evidence, restoreState) {
  await mkdir(evidence, { recursive: true })
  const distribution = verifyDesktopPackage(resources, pkg.version)
  const userData = path.join(evidence, 'user-data')
  const env = { ...process.env, STAR_CAT_SAVE_DB: path.join(userData, 'saves.sqlite') }
  delete env.ELECTRON_RUN_AS_NODE
  const args = [`--user-data-dir=${userData}`, '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  const errors = [], failedResponses = [], consoleErrors = []
  let instance, page, origin, snapshot, runtime
  const launch = async () => {
    instance = await _electron.launch({ executablePath: executable, args, env, timeout: 60000 })
    page = await instance.firstWindow({ timeout: 60000 })
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('favicon.ico')) failedResponses.push({ url: response.url(), status: response.status() }) })
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    await expect(page.getByTestId('character-1')).toBeVisible({ timeout: 120000 })
    await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0, { timeout: 120000 })
    await expect(page.getByLabel('素材画质', { exact: true })).toHaveValue('hd')
    await expect(page.locator('.asset-profile-error, vite-error-overlay')).toHaveCount(0)
    expect(await page.title()).toContain('星猫')
    origin = new URL(page.url()).origin
  }
  const state = async () => JSON.parse(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))
  const close = async () => {
    await instance.close()
    instance = undefined
    let stopped = false
    try { await fetch(origin + '/api/session', { signal: AbortSignal.timeout(5000) }) } catch { stopped = true }
    expect(stopped, 'closing the app must stop its server').toBe(true)
  }
  try {
    await launch()
    runtime = await instance.evaluate(({ app, BrowserWindow }) => {
      const preferences = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()
      return { version: app.getVersion(), packaged: app.isPackaged, appPath: app.getAppPath(), platform: process.platform, arch: process.arch, electron: process.versions.electron, node: process.versions.node, security: { sandbox: preferences.sandbox, nodeIntegration: preferences.nodeIntegration, contextIsolation: preferences.contextIsolation } }
    })
    expect(runtime.packaged).toBe(true)
    expect(runtime.platform).toBe(process.platform)
    expect(runtime.arch).toBe(process.arch)
    expect(runtime.electron).toBe('45.2.1')
    expect(runtime.node).toBe('24.22.1')
    expect(runtime.security).toEqual({ sandbox: true, nodeIntegration: false, contextIsolation: true })
    if (restoreState) {
      await page.getByRole('button', { name: '读取存档', exact: true }).click()
      await page.getByTestId('load-slot-1').click()
      await expect(page.getByRole('status').filter({ hasText: '对局已载入' })).toBeVisible({ timeout: 120000 })
      expect(await state()).toEqual(restoreState)
      await page.screenshot({ path: path.join(evidence, 'installed-after-overwrite.png') })
      await close()
      expect(errors).toEqual([]); expect(failedResponses).toEqual([]); expect(consoleErrors).toEqual([])
      const result = { overwritePreserved: true, rngState: restoreState.rngState }
      await writeFile(path.join(evidence, 'overwrite-report.json'), JSON.stringify(result, null, 2))
      return result
    }
    const beforeNavigation = page.url()
    let externalRequests = 0
    const external = createServer((_request, response) => { externalRequests++; response.end('<h1>Outside application origin</h1>') })
    await new Promise(resolve => external.listen(0, '127.0.0.1', resolve))
    try {
      const externalUrl = `http://127.0.0.1:${external.address().port}/outside`
      await page.evaluate(url => { const anchor = document.createElement('a'); anchor.href = url; document.body.append(anchor); anchor.click(); anchor.remove() }, externalUrl)
      await page.waitForTimeout(250)
      expect(page.url()).toBe(beforeNavigation)
      expect(externalRequests).toBe(0)
    } finally { await new Promise((resolve, reject) => external.close(error => error ? reject(error) : resolve())) }
    expect(await page.evaluate(() => window.open('about:blank') === null)).toBe(true)
    expect(instance.windows()).toHaveLength(1)
    // Keep navigation-denial checks separate from Playwright's subsequent action auto-waits.
    await close()
    await launch()

    for (const id of [1, 2, 9, 11]) await page.getByTestId(`character-${id}`).click()
    await page.getByRole('button', { name: '开始对局', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: '对局已载入' })).toBeVisible({ timeout: 120000 })
    const before = await state()
    await page.getByTestId('open-saves').click()
    await expect(page.getByTestId('save-slot-1')).toBeEnabled()
    await page.getByTestId('save-slot-1').click()
    if (await page.getByTestId('save-confirm').isVisible()) await page.getByTestId('save-confirm').click()
    await expect(page.getByRole('dialog', { name: '手动存读档' }).getByRole('status').filter({ hasText: '槽位1保存成功' })).toBeVisible({ timeout: 20000 })
    snapshot = await page.evaluate(async () => {
      const { csrfToken } = await (await fetch('/api/session')).json()
      return (await (await fetch('/api/saves/1', { headers: { 'x-csrf-token': csrfToken } })).json()).snapshot
    })
    expect(snapshot.state).toEqual(before)
    await page.screenshot({ path: path.join(evidence, 'installed-save.png') })
    await close()
    await launch()
    await page.getByRole('button', { name: '读取存档', exact: true }).click()
    await page.getByTestId('load-slot-1').click()
    await expect(page.getByRole('status').filter({ hasText: '对局已载入' })).toBeVisible({ timeout: 120000 })
    expect(await state()).toEqual(snapshot.state)
    await page.screenshot({ path: path.join(evidence, 'installed-restarted-game.png') })
    await page.getByRole('button', { name: '掷骰', exact: true }).click()
    await expect.poll(async () => (await state()).lastRoll, { timeout: 15000 }).not.toBeNull()
    expect((await state()).lastRoll).toBeGreaterThanOrEqual(1)
    expect((await state()).lastRoll).toBeLessThanOrEqual(6)
    await close()
    expect(errors).toEqual([])
    expect(failedResponses).toEqual([])
    expect(consoleErrors).toEqual([])
    const result = { ...distribution, runtime, sourceCommit: process.env.STAR_CAT_SOURCE_COMMIT ?? null, defaultProfile: 'hd', saveRestartPreserved: true, rngState: snapshot.state.rngState, rollVerified: true, serverStopped: true, errors, failedResponses, consoleErrors }
    await writeFile(path.join(evidence, 'report.json'), JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result, null, 2))
    return { ...result, savedState: snapshot.state }
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(evidence, 'failure.png') }).catch(() => {})
    await writeFile(path.join(evidence, 'failure.txt'), String(error))
    throw error
  } finally { if (instance) await instance.close().catch(() => {}) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [executable, resources, evidence] = process.argv.slice(2)
  if (!executable || !resources || !evidence) throw new Error('Usage: desktop-smoke <installed executable> <Resources> <evidence directory>')
  await smokeDesktop(path.resolve(executable), path.resolve(resources), path.resolve(evidence))
}
