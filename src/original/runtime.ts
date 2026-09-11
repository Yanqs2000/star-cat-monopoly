export interface OriginalMetadata {
  width: number
  height: number
  swfVersion: number
  isActionScript3: boolean
}
export interface RuffleApi {
  load(options: Record<string, unknown>): Promise<void>
  metadata: OriginalMetadata | null
  readyState: number
  volume: number
  suspend(): void
  resume(): void
}
export interface RuffleElement extends HTMLElement {
  ruffle(): RuffleApi
}
interface RuffleGlobal {
  config?: Record<string, unknown>
  newest?: () => { createPlayer(): RuffleElement }
}
declare global {
  interface Window { RufflePlayer?: RuffleGlobal }
}

let pending: Promise<void> | undefined
export function loadRuntime(): Promise<void> {
  if (window.RufflePlayer?.newest) return Promise.resolve()
  if (pending) return pending
  pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    window.RufflePlayer = { config: { polyfills: false, publicPath: `${import.meta.env.BASE_URL}ruffle/` } }
    script.src = `${import.meta.env.BASE_URL}ruffle/ruffle.js`
    script.onload = () => {
      if (window.RufflePlayer?.newest) resolve()
      else { pending = undefined; script.remove(); reject(new Error('兼容运行库未能初始化')) }
    }
    script.onerror = () => {
      pending = undefined
      script.remove()
      reject(new Error('兼容运行库加载失败，请检查本地服务后重试'))
    }
    document.head.append(script)
  })
  return pending
}

export async function checkOriginalFiles(signal: AbortSignal): Promise<void> {
  const base = `${import.meta.env.BASE_URL}original/`
  const response = await fetch(`${base}manifest.json`, { signal })
  if (!response.ok) throw new Error('原版资源清单缺失')
  const manifest = await response.json() as { files: Array<{ name: string; bytes: number }> }
  await Promise.all(manifest.files.map(async file => {
    const result = await fetch(`${base}${file.name}`, { method: 'HEAD', signal })
    if (!result.ok || result.headers.get('content-type')?.includes('text/html')) {
      throw new Error(`原版资源缺失：${file.name}`)
    }
    const length = result.headers.get('content-length')
    if (length && Number(length) !== file.bytes) throw new Error(`原版资源不完整：${file.name}`)
  }))
}
