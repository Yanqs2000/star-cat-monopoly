export const FACINGS = ['down-right', 'down-left', 'up-left', 'up-right'] as const
export type Facing = typeof FACINGS[number]
export interface FrameAsset {
  sourceFrame: number
  url: string
  durationMs: number
  offsetX: number
  offsetY: number
}
export interface WalkClip { facing: Facing; sourceSpriteId: number; frames: FrameAsset[] }
export interface AssetManifest {
  version: 1
  map: { url: string; sourceId: number; width: number; height: number; offsetX: number; offsetY: number }
  clips: WalkClip[]
}
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const assetPath = (v: unknown): v is string => typeof v === 'string' && /^assets\/[\w/-]+\.png$/.test(v)
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('素材清单结构错误')
  return value as Record<string, unknown>
}
export function parseAssetManifest(value: unknown): AssetManifest {
  const raw = record(value)
  const map = record(raw.map)
  if (raw.version !== 1 || !assetPath(map.url) || !finite(map.sourceId) ||
      !finite(map.width) || map.width <= 0 || !finite(map.height) || map.height <= 0 ||
      !finite(map.offsetX) || !finite(map.offsetY)) throw new Error('地图素材定义错误')
  if (!Array.isArray(raw.clips) || raw.clips.length !== 4) throw new Error('缺少四方向动作')
  const clips = raw.clips.map((value, index) => {
    const clip = record(value)
    const facing = FACINGS[index]!
    if (clip.facing !== facing || !finite(clip.sourceSpriteId) || !Array.isArray(clip.frames) || clip.frames.length === 0) throw new Error(`${facing} 动作帧数量错误`)
    const frames = clip.frames.map((value, frameIndex): FrameAsset => {
      const f = record(value)
      if (f.sourceFrame !== frameIndex + 1 || !assetPath(f.url) || !finite(f.durationMs) || f.durationMs <= 0 || !finite(f.offsetX) || !finite(f.offsetY)) throw new Error(`${facing} 第${frameIndex + 1}帧的顺序或定义错误`)
      return { sourceFrame: frameIndex + 1, url: f.url, durationMs: f.durationMs, offsetX: f.offsetX, offsetY: f.offsetY }
    })
    return { facing, sourceSpriteId: clip.sourceSpriteId, frames }
  })
  return { version: 1, map: { url: map.url, sourceId: map.sourceId, width: map.width, height: map.height, offsetX: map.offsetX, offsetY: map.offsetY }, clips }
}
export function frameAtElapsed(clip: WalkClip, elapsedMs: number): FrameAsset {
  const duration = clip.frames.reduce((sum, frame) => sum + frame.durationMs, 0)
  let time = Math.max(0, elapsedMs) % duration
  for (const frame of clip.frames) {
    if (time < frame.durationMs) return frame
    time -= frame.durationMs
  }
  return clip.frames[clip.frames.length - 1]!
}
