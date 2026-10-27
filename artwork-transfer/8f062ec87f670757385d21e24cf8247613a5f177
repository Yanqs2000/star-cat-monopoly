import carnivalGeometry from '../../data/carnival-geometry.json'
import { staticAssetPixels } from '../assets/profiles'
export interface ActivityTextField {
  characterId: number; variable: string; x: number; y: number
  matrix: [number, number, number, number]; width: number; height: number; fontSize: number; align: number
}
export interface ActivityFrame {
  sourceFrame: number; url: string; width: number; height: number; offsetX: number; offsetY: number; fields: ActivityTextField[];placements?:{name:string;x:number;y:number;matrix:[number,number,number,number]}[]
}
export interface ActivityClip { id: string; sourceSymbol: number; fps: number; frames: ActivityFrame[] }
export interface NativeOverlay { clip: ActivityClip; frame: number; x: number; y: number; scale?: number; opacity?: number; text?: Record<string,string>; depth?: number;matrix?:[number,number,number,number] }
export interface ActivityManifest { version: 1; sourceSha256: string; clips: ActivityClip[] }

export function activityPixelDensity(url:string):number {
  return staticAssetPixels(url)?.pixelDensity ?? (url.startsWith('assets-hd/')?2:1)
}

export function parseActivityAssets(value: unknown): ActivityManifest {
  const data = value as ActivityManifest
  if (data?.version !== 1 || data.sourceSha256 !== '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba' ||
      !Array.isArray(data.clips) || new Set(data.clips.map(item => item.id)).size !== data.clips.length) throw new Error('活动素材清单无效')
  const required: Record<string, number> = { 'carnival-play':1,'carnival-score':1,'carnival-intro':90,'carnival-ball-1':30,'carnival-ball-2':30,'carnival-ball-3':30,'carnival-ball-4':30, 'ludo-betting':1,'ludo-ai-betting':1,'ludo-game':1,'ludo-dice':40,'ludo-win':40,'ludo-chip':1, fog: 19, car2: 111, witch: 1, lottery: 1, 'show-npc4': 50,
    'trait-9': 60, 'trait-12': 60, 'trait-13': 60, 'trait-14': 60, 'trait-15': 60, 'trait-23': 60,
    station:1,'court-target':1,'court-case':1,'court-verdict':1,show2:45,car1:113,'court-highlight':23,'map-mini':1,'magic-talk':1 }
  for(let face=1;face<=6;face++){required[`ludo-face-${face}`]=1;required[`ludo-shadow-${face}`]=1}
  for(let character=1;character<=12;character++) {
    required[`carnival-boy-${character}`]=3;required[`carnival-walk-${character}-left`]=carnivalGeometry.walk[character-1]![0]!.length;required[`carnival-walk-${character}-right`]=carnivalGeometry.walk[character-1]![1]!.length;required[`face-${character}`]=1;required[`head-${character}`]=1
    for(let direction=1;direction<=4;direction++)required[`fly-${character}-${direction}`]=1
  }
  for (const [id, count] of Object.entries(required)) {
    if (data.clips.find(clip => clip.id === id)?.frames?.length !== count) throw new Error(`缺少活动时间轴：${id}`)
  }
  for (const clip of data.clips) {
    if (!/^[a-z0-9-]+$/.test(clip.id) || clip.fps !== 30 || !Array.isArray(clip.frames) || clip.frames.length === 0) throw new Error('活动时间轴无效')
    for (const [index, frame] of clip.frames.entries()) {
      if (frame.sourceFrame !== index + 1 || frame.url !== `assets/activities/${clip.id}/${index + 1}.png` ||
          !Number.isInteger(frame.width) || frame.width <= 0 || !Number.isInteger(frame.height) || frame.height <= 0 ||
          !Number.isFinite(frame.offsetX) || !Number.isFinite(frame.offsetY) || !Array.isArray(frame.fields)) throw new Error('活动原图几何无效')
      for (const field of frame.fields) {
        if (typeof field.variable !== 'string' || ![field.x, field.y, field.width, field.height, field.fontSize, ...field.matrix].every(Number.isFinite) || field.matrix.length !== 4) throw new Error('活动文字坐标无效')
      }
    }
  }
  return data
}

/** Every native frame is decoded before its clock runs; URLs belong to this renderer. */
export async function loadActivityFrames(clip: ActivityClip, signal: AbortSignal): Promise<{ urls: string[]; release(): void }> {
  const urls: string[] = []
  let cursor = 0
  const abort = new AbortController()
  const cancel = () => abort.abort(signal.reason)
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) cancel()
  const workers = Array.from({ length: Math.min(6, clip.frames.length) }, async () => {
    while (cursor < clip.frames.length && !abort.signal.aborted) {
      const index = cursor++
      const frame = clip.frames[index]!
      const response = await fetch(`${import.meta.env.BASE_URL}${frame.url}`, { signal: abort.signal })
      if (!response.ok) throw new Error(`活动素材加载失败：${frame.url}（HTTP ${response.status}）`)
      const blob = await response.blob()
      abort.signal.throwIfAborted()
      const url = URL.createObjectURL(blob)
      urls[index] = url
      const image = new Image()
      image.src = url
      await image.decode()
      abort.signal.throwIfAborted()
      const pixelDensity=activityPixelDensity(frame.url)
      const expected = staticAssetPixels(frame.url)?.pixelSize ?? [frame.width*pixelDensity, frame.height*pixelDensity]
      if (image.naturalWidth !== expected[0] || image.naturalHeight !== expected[1]) throw new Error(`活动素材尺寸错误：${frame.url}`)
    }
  })
  try {
    await Promise.all(workers)
    abort.signal.throwIfAborted()
    return { urls, release: () => urls.forEach(url => URL.revokeObjectURL(url)) }
  } catch (error) {
    abort.abort(error)
    await Promise.allSettled(workers)
    urls.forEach(url => URL.revokeObjectURL(url))
    throw error
  } finally {
    signal.removeEventListener('abort', cancel)
  }
}
