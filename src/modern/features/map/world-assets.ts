export interface WorldFrame {
  url: string
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export interface WorldClip {
  id: string
  fps: 30
  loop: boolean
  frames: WorldFrame[]
  sourceSymbol: number
}

export type WorldFacing = 1 | 2 | 3 | 4
export type NeutralHouseLevel = 1 | 2 | 3 | 4 | 5

export interface NeutralHouseFrame extends WorldFrame {
  facing: WorldFacing
  level: NeutralHouseLevel
  sourceFrame: number
}

export interface WorldAssetsManifest {
  version: 1
  sourceSha256: string
  clips: WorldClip[]
  neutralHouses: NeutralHouseFrame[]
}

const EXPECTED_CLIPS = new Map<string, {
  frames: number
  sourceSymbol: number
  loop: boolean
}>([
  ['npc-1', { frames: 3, sourceSymbol: 298, loop: true }],
  ['npc-2', { frames: 54, sourceSymbol: 310, loop: true }],
  ['npc-3', { frames: 12, sourceSymbol: 372, loop: true }],
  ['npc-4', { frames: 55, sourceSymbol: 226, loop: true }],
  ['npc-5', { frames: 22, sourceSymbol: 335, loop: true }],
  ['npc-9', { frames: 104, sourceSymbol: 293, loop: true }],
  ['npc-10', { frames: 18, sourceSymbol: 361, loop: true }],
  ['npc-11', { frames: 18, sourceSymbol: 350, loop: true }],
  ['npc-12', { frames: 81, sourceSymbol: 263, loop: true }],
  ['npc-13', { frames: 33, sourceSymbol: 280, loop: true }],
  ['npc-14', { frames: 24, sourceSymbol: 248, loop: true }],
  ['npc-15', { frames: 26, sourceSymbol: 235, loop: true }],
  ['barrier-1', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['barrier-2', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['barrier-3', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['barrier-4', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['mine', { frames: 80, sourceSymbol: 3696, loop: true }],
  ['rocket', { frames: 80, sourceSymbol: 1080, loop: false }],
  ['explosion', { frames: 60, sourceSymbol: 1027, loop: false }],
  ['card-gain', { frames: 50, sourceSymbol: 1163, loop: false }],
  ['ticket-gain', { frames: 30, sourceSymbol: 1185, loop: false }],
])

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const positiveInteger = (value: unknown): value is number =>
  finite(value) && Number.isInteger(value) && value > 0
const facing = (value: unknown): value is WorldFacing =>
  value === 1 || value === 2 || value === 3 || value === 4
const level = (value: unknown): value is NeutralHouseLevel =>
  value === 1 || value === 2 || value === 3 || value === 4 || value === 5
const assetPath = (value: unknown): value is string =>
  typeof value === 'string' && /^assets\/world\/[a-z0-9/-]+\.png$/.test(value)

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('世界素材清单结构错误')
  }
  return value as Record<string, unknown>
}

function parseFrame(value: unknown, error: string): WorldFrame {
  const raw = record(value)
  if (!assetPath(raw.url) || !positiveInteger(raw.width) || !positiveInteger(raw.height) ||
      !finite(raw.offsetX) || !finite(raw.offsetY)) {
    throw new Error(error)
  }
  return {
    url: raw.url,
    width: raw.width,
    height: raw.height,
    offsetX: raw.offsetX,
    offsetY: raw.offsetY,
  }
}

export function parseWorldAssets(value: unknown): WorldAssetsManifest {
  const raw = record(value)
  if (raw.version !== 1) throw new Error('世界素材清单版本错误')
  if (typeof raw.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(raw.sourceSha256)) {
    throw new Error('来源哈希错误')
  }
  if (!Array.isArray(raw.clips) || raw.clips.length !== EXPECTED_CLIPS.size) {
    throw new Error('必须完整包含 21 个世界动画')
  }
  if (!Array.isArray(raw.neutralHouses) || raw.neutralHouses.length !== 20) {
    throw new Error('必须完整包含 20 个中立房屋')
  }

  const clips = raw.clips.map((value) => {
    const item = record(value)
    if (typeof item.id !== 'string' || item.fps !== 30 || typeof item.loop !== 'boolean' ||
        !positiveInteger(item.sourceSymbol) || !Array.isArray(item.frames) || item.frames.length === 0) {
      throw new Error('世界动画定义错误')
    }
    return {
      id: item.id,
      fps: 30 as const,
      loop: item.loop,
      sourceSymbol: item.sourceSymbol,
      frames: item.frames.map(frame => parseFrame(frame, '世界动画帧定义错误')),
    }
  })
  if (new Set(clips.map(({ id }) => id)).size !== clips.length) {
    throw new Error('世界动画 ID 重复')
  }
  if (clips.some(({ id }) => !EXPECTED_CLIPS.has(id))) {
    throw new Error('世界动画覆盖错误')
  }
  for (const clip of clips) {
    const expected = EXPECTED_CLIPS.get(clip.id)!
    if (clip.frames.length !== expected.frames || clip.sourceSymbol !== expected.sourceSymbol ||
        clip.loop !== expected.loop) {
      throw new Error('世界动画来源定义错误')
    }
    if (clip.frames.some((frame, index) =>
      frame.url !== `assets/world/${clip.id}/${index + 1}.png`)) {
      throw new Error('世界动画帧路径错误')
    }
  }

  const neutralHouses = raw.neutralHouses.map((value) => {
    const item = record(value)
    const parsed = parseFrame(value, '中立房屋定义错误')
    if (!facing(item.facing) || !level(item.level) || !positiveInteger(item.sourceFrame)) {
      throw new Error('中立房屋定义错误')
    }
    return {
      ...parsed,
      facing: item.facing,
      level: item.level,
      sourceFrame: item.sourceFrame,
    }
  })
  const houseKeys = neutralHouses.map(({ facing, level }) => `${facing}:${level}`)
  if (new Set(houseKeys).size !== neutralHouses.length) {
    throw new Error('中立房屋变体重复')
  }
  for (const house of neutralHouses) {
    if (house.url !== `assets/world/neutral-houses/${house.facing}/${house.level}.png`) {
      throw new Error('中立房屋路径错误')
    }
    if (house.sourceFrame !== (house.facing - 1) * 10 + house.level + 1) {
      throw new Error('中立房屋源帧错误')
    }
  }

  return {
    version: 1,
    sourceSha256: raw.sourceSha256,
    clips,
    neutralHouses,
  }
}
