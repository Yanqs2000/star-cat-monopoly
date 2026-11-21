import { app, BrowserWindow, dialog } from 'electron'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { isAppNavigation, resolveGameRoot, startDesktopServer } from './runtime'

app.setName('星猫大富翁')
const requestedData = app.commandLine.getSwitchValue('user-data-dir')
const userData = requestedData ? path.resolve(requestedData) : path.join(app.getPath('appData'), 'StarCatMonopoly')
mkdirSync(userData, { recursive: true })
app.setPath('userData', userData)

let window: BrowserWindow | undefined
let server: Awaited<ReturnType<typeof startDesktopServer>> | undefined
let closing = false

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore()
    window?.show()
    window?.focus()
  })
  app.on('window-all-closed', () => app.quit())
  app.on('before-quit', event => {
    if (!server || closing) return
    event.preventDefault()
    closing = true
    void server.close().catch(error => console.error('关闭存档服务失败', error)).finally(() => app.quit())
  })
  void app.whenReady().then(async () => {
    const staticRoot = resolveGameRoot(app.isPackaged, process.resourcesPath, __dirname)
    server = await startDesktopServer({ userData, staticRoot, dbPath: process.env.STAR_CAT_SAVE_DB })
    const origin = server.origin
    window = new BrowserWindow({
      width: 1366, height: 900, minWidth: 900, minHeight: 650,
      title: '星猫大富翁', show: false, backgroundColor: '#66ccff',
      webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
    })
    window.setMenuBarVisibility(false)
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', (event, url) => { if (!isAppNavigation(url, origin)) event.preventDefault() })
    window.once('ready-to-show', () => window?.show())
    window.on('closed', () => { window = undefined })
    await window.loadURL(origin + '/modern.html')
  }).catch(async error => {
    console.error(error)
    await server?.close().catch(() => {})
    dialog.showErrorBox('星猫大富翁启动失败', error instanceof Error ? error.message : String(error))
    app.exit(1)
  })
}
