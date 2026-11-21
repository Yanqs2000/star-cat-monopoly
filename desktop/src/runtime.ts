import { mkdirSync, chmodSync } from 'node:fs'
import path from 'node:path'
import { createSaveServer } from '../../server/app'

export function resolveSavePath(userData: string, override?: string): string {
  return override?.trim() ? path.resolve(override) : path.join(userData, 'saves.sqlite')
}

export function resolveGameRoot(packaged: boolean, resourcesPath: string, compiledDir: string): string {
  return packaged ? path.join(resourcesPath, 'game') : path.resolve(compiledDir, '../..', 'dist-modern')
}

export function isAppNavigation(url: string, origin: string): boolean {
  try {
    const target = new URL(url)
    return target.protocol === 'http:' && target.origin === origin && !target.username && !target.password
  } catch { return false }
}

export async function startDesktopServer(options: { userData: string; staticRoot: string; dbPath?: string }) {
  const dbPath = resolveSavePath(options.userData, options.dbPath)
  mkdirSync(path.dirname(dbPath), { recursive: true, mode: 0o700 })
  const server = await createSaveServer({ dbPath, staticRoot: options.staticRoot, allowedOrigins: [] })
  try {
    chmodSync(dbPath, 0o600)
    const origin = await server.listen({ host: '127.0.0.1', port: 0 })
    let closing: Promise<void> | undefined
    return { origin, close: () => closing ??= server.close() }
  } catch (error) { await server.close(); throw error }
}
