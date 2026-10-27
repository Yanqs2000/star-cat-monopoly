import type { Facing } from './assets'
import { FACINGS } from './assets'
import type { WorldFrame } from '../map/world-assets'

export const REACTION_NAMES = ['neutral', 'ready', 'happy', 'sad', 'hurt'] as const
export type ReactionName = typeof REACTION_NAMES[number]
export type GodId = 2 | 3 | 4 | 5 | 10 | 11

export interface ReactionClip {
  name: ReactionName
  facing: Facing
  fps: 30
  loop: false
  frames: WorldFrame[]
  sourceRootFrame: number
  sourceSymbol: number
}

export interface GodOverlay extends WorldFrame {
  godId: GodId
}

export interface ReactionManifest {
  version: 1
  characterId: number
  sourceSha256: string
  clips: ReactionClip[]
  godOverlays: GodOverlay[]
}

const GOD_IDS = [2, 3, 4, 5, 10, 11] as const
const ROOT_OFFSETS: Record<ReactionName, number> = {
  neutral: 1,
  ready: 7,
  happy: 3,
  sad: 5,
  hurt: 10,
}

// Facing-major and reaction-major, matching FACINGS and REACTION_NAMES.
const SOURCE_SYMBOLS: Record<number, readonly number[]> = {
  1: [2, 132, 69, 113, 193, 195, 310, 247, 291, 371, 373, 490, 425, 471, 551, 553, 666, 603, 647, 727],
  2: [2, 128, 69, 109, 189, 191, 302, 243, 283, 363, 365, 476, 417, 457, 537, 539, 648, 589, 629, 709],
  3: [2, 126, 63, 107, 187, 189, 298, 235, 279, 359, 361, 470, 407, 451, 531, 533, 640, 577, 621, 701],
  4: [2, 130, 67, 111, 191, 193, 306, 243, 287, 367, 369, 482, 419, 463, 543, 545, 658, 595, 639, 719],
  5: [2, 132, 69, 113, 193, 225, 338, 275, 319, 399, 431, 544, 481, 525, 605, 637, 750, 687, 731, 811],
  6: [2, 109, 52, 100, 170, 172, 281, 224, 272, 342, 344, 453, 396, 444, 514, 516, 625, 568, 616, 686],
  7: [2, 126, 63, 107, 187, 189, 298, 235, 279, 359, 361, 470, 407, 451, 531, 533, 642, 579, 623, 703],
  8: [2, 124, 61, 105, 183, 185, 292, 229, 273, 351, 353, 461, 398, 442, 520, 522, 629, 566, 610, 688],
  9: [2, 126, 63, 107, 193, 195, 304, 241, 285, 371, 373, 482, 419, 463, 549, 551, 660, 597, 641, 727],
  10: [2, 128, 65, 109, 189, 191, 302, 239, 283, 363, 365, 476, 413, 457, 537, 539, 650, 587, 631, 711],
  11: [2, 126, 63, 107, 187, 189, 298, 235, 279, 359, 361, 470, 407, 451, 531, 533, 642, 579, 623, 709],
  12: [2, 128, 65, 109, 189, 191, 304, 241, 285, 367, 369, 480, 417, 461, 541, 543, 654, 591, 635, 715],
}

function expectedFrames(characterId: number, facing: Facing, name: ReactionName): number {
  if (name === 'neutral' || name === 'ready') return 1
  if (name === 'hurt') return characterId === 8 ? 33 : 60
  if (name === 'happy') {
    if (characterId === 6 && facing === 'down-right') return 68
    if (characterId === 9) return 43
    if (characterId === 10 || characterId === 12) return 46
    return 57
  }
  if (characterId === 2) return 63
  if (characterId === 6) return 69
  if ((characterId === 1 && facing === 'down-left') ||
      (characterId === 5 && facing === 'up-right')) return 74
  return 73
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const positiveInteger = (value: unknown): value is number =>
  finite(value) && Number.isInteger(value) && value > 0
const isFacing = (value: unknown): value is Facing =>
  FACINGS.includes(value as Facing)
const isReaction = (value: unknown): value is ReactionName =>
  REACTION_NAMES.includes(value as ReactionName)
const isGodId = (value: unknown): value is GodId =>
  GOD_IDS.includes(value as GodId)

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('反馈素材清单结构错误')
  }
  return value as Record<string, unknown>
}

function parseFrame(value: unknown, _characterId: number, error: string): WorldFrame {
  const raw = record(value)
  const path = typeof raw.url === 'string' &&
    /^assets\/characters\/[1-9][0-9]*\/reactions\/[a-z0-9/-]+\.png$/.test(raw.url)
  if (!path || !positiveInteger(raw.width) || !positiveInteger(raw.height) ||
      !finite(raw.offsetX) || !finite(raw.offsetY)) {
    throw new Error(error)
  }
  return {
    url: raw.url as string,
    width: raw.width,
    height: raw.height,
    offsetX: raw.offsetX,
    offsetY: raw.offsetY,
  }
}

export function parseReactionManifest(value: unknown): ReactionManifest {
  const raw = record(value)
  if (raw.version !== 1) throw new Error('反馈素材清单版本错误')
  if (!positiveInteger(raw.characterId) || raw.characterId > 12) {
    throw new Error('角色编号错误')
  }
  const characterId = raw.characterId
  if (typeof raw.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(raw.sourceSha256)) {
    throw new Error('来源哈希错误')
  }
  if (!Array.isArray(raw.clips) || raw.clips.length !== 20) {
    throw new Error('必须完整包含 20 个反馈动作')
  }
  if (!Array.isArray(raw.godOverlays) || raw.godOverlays.length !== 6) {
    throw new Error('必须完整包含 6 个神仙覆盖层')
  }

  const clips = raw.clips.map((value): ReactionClip => {
    const item = record(value)
    if (!isReaction(item.name) || !isFacing(item.facing) || item.fps !== 30 ||
        item.loop !== false || !positiveInteger(item.sourceRootFrame) ||
        !positiveInteger(item.sourceSymbol) || !Array.isArray(item.frames) ||
        item.frames.length === 0) {
      throw new Error('反馈动作定义错误')
    }
    return {
      name: item.name,
      facing: item.facing,
      fps: 30,
      loop: false,
      sourceRootFrame: item.sourceRootFrame,
      sourceSymbol: item.sourceSymbol,
      frames: item.frames.map(frame =>
        parseFrame(frame, characterId, '反馈动作帧定义错误')),
    }
  })
  const keys = clips.map(({ facing, name }) => `${facing}:${name}`)
  if (new Set(keys).size !== clips.length) throw new Error('反馈动作重复')
  if (FACINGS.some(facing => REACTION_NAMES.some(name =>
    !keys.includes(`${facing}:${name}`)))) {
    throw new Error('反馈动作覆盖错误')
  }

  for (const clip of clips) {
    const facingIndex = FACINGS.indexOf(clip.facing)
    const reactionIndex = REACTION_NAMES.indexOf(clip.name)
    const definitionIndex = facingIndex * REACTION_NAMES.length + reactionIndex
    const expectedRoot = facingIndex * 30 + ROOT_OFFSETS[clip.name]
    if (clip.sourceRootFrame !== expectedRoot ||
        clip.sourceSymbol !== SOURCE_SYMBOLS[characterId]![definitionIndex] ||
        clip.frames.length !== expectedFrames(characterId, clip.facing, clip.name)) {
      throw new Error('反馈动作来源定义错误')
    }
    if (clip.frames.some((frame, index) =>
      frame.url !== `assets/characters/${characterId}/reactions/${clip.name}/${clip.facing}/${index + 1}.png`)) {
      throw new Error('反馈动作帧路径错误')
    }
  }

  const godOverlays = raw.godOverlays.map((value): GodOverlay => {
    const item = record(value)
    const parsed = parseFrame(value, characterId, '神仙覆盖层定义错误')
    if (!isGodId(item.godId)) throw new Error('神仙覆盖层定义错误')
    return { ...parsed, godId: item.godId }
  })
  const godIds = godOverlays.map(({ godId }) => godId)
  if (new Set(godIds).size !== GOD_IDS.length || GOD_IDS.some(id => !godIds.includes(id))) {
    throw new Error('神仙覆盖层定义错误')
  }
  for (const overlay of godOverlays) {
    if (overlay.url !== `assets/characters/${characterId}/reactions/gods/${overlay.godId}.png`) {
      throw new Error('神仙覆盖层路径错误')
    }
  }

  return {
    version: 1,
    characterId,
    sourceSha256: raw.sourceSha256,
    clips,
    godOverlays,
  }
}

export class ReactionPlayer {
  #clip: ReactionClip
  #elapsedMs = 0
  #paused = false
  #speed = 1

  constructor(clip: ReactionClip) {
    this.#clip = clip
  }

  get clip(): ReactionClip { return this.#clip }
  get frameIndex(): number {
    return Math.min(
      Math.floor(this.#elapsedMs * this.#clip.fps / 1000 + Number.EPSILON),
      this.#clip.frames.length - 1,
    )
  }
  get currentFrame(): WorldFrame { return this.#clip.frames[this.frameIndex]! }
  get finished(): boolean { return this.frameIndex === this.#clip.frames.length - 1 }

  advance(deltaMs: number): WorldFrame {
    if (!finite(deltaMs) || deltaMs < 0) throw new Error('反馈动作时间必须为非负数')
    if (!this.#paused && !this.finished) this.#elapsedMs += deltaMs * this.#speed
    return this.currentFrame
  }

  setPaused(paused: boolean): void { this.#paused = paused }

  setSpeed(speed: number): void {
    if (!finite(speed) || speed <= 0) throw new Error('反馈动作速度必须为正数')
    this.#speed = speed
  }

  reset(clip: ReactionClip = this.#clip): void {
    this.#clip = clip
    this.#elapsedMs = 0
  }
}
