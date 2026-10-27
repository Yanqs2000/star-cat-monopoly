import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ReactionPlayer,
  parseReactionManifest,
  type ReactionClip,
  type ReactionManifest,
  type ReactionName,
} from '../../src/modern/features/characters/reactions'
import type { Facing } from '../../src/modern/features/characters/assets'

const ROOT = resolve(import.meta.dirname, '../..')
const FACINGS = ['down-right', 'down-left', 'up-left', 'up-right'] as const
const GOD_IDS = [2, 3, 4, 5, 10, 11] as const
type Expected = readonly [ReactionName, number, number, number]

// Hand-checked against docs/modernization/phase-3a-art-evidence.md. Each tuple is
// [reaction, source root frame, source depth-1 symbol, source child frame count].
const EXPECTED: Record<number, Record<Facing, readonly Expected[]>> = {
  1: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 132, 1], ['happy', 3, 69, 57], ['sad', 5, 113, 73], ['hurt', 10, 193, 60]],
    'down-left': [['neutral', 31, 195, 1], ['ready', 37, 310, 1], ['happy', 33, 247, 57], ['sad', 35, 291, 74], ['hurt', 40, 371, 60]],
    'up-left': [['neutral', 61, 373, 1], ['ready', 67, 490, 1], ['happy', 63, 425, 57], ['sad', 65, 471, 73], ['hurt', 70, 551, 60]],
    'up-right': [['neutral', 91, 553, 1], ['ready', 97, 666, 1], ['happy', 93, 603, 57], ['sad', 95, 647, 73], ['hurt', 100, 727, 60]],
  },
  2: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 128, 1], ['happy', 3, 69, 57], ['sad', 5, 109, 63], ['hurt', 10, 189, 60]],
    'down-left': [['neutral', 31, 191, 1], ['ready', 37, 302, 1], ['happy', 33, 243, 57], ['sad', 35, 283, 63], ['hurt', 40, 363, 60]],
    'up-left': [['neutral', 61, 365, 1], ['ready', 67, 476, 1], ['happy', 63, 417, 57], ['sad', 65, 457, 63], ['hurt', 70, 537, 60]],
    'up-right': [['neutral', 91, 539, 1], ['ready', 97, 648, 1], ['happy', 93, 589, 57], ['sad', 95, 629, 63], ['hurt', 100, 709, 60]],
  },
  3: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 126, 1], ['happy', 3, 63, 57], ['sad', 5, 107, 73], ['hurt', 10, 187, 60]],
    'down-left': [['neutral', 31, 189, 1], ['ready', 37, 298, 1], ['happy', 33, 235, 57], ['sad', 35, 279, 73], ['hurt', 40, 359, 60]],
    'up-left': [['neutral', 61, 361, 1], ['ready', 67, 470, 1], ['happy', 63, 407, 57], ['sad', 65, 451, 73], ['hurt', 70, 531, 60]],
    'up-right': [['neutral', 91, 533, 1], ['ready', 97, 640, 1], ['happy', 93, 577, 57], ['sad', 95, 621, 73], ['hurt', 100, 701, 60]],
  },
  4: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 130, 1], ['happy', 3, 67, 57], ['sad', 5, 111, 73], ['hurt', 10, 191, 60]],
    'down-left': [['neutral', 31, 193, 1], ['ready', 37, 306, 1], ['happy', 33, 243, 57], ['sad', 35, 287, 73], ['hurt', 40, 367, 60]],
    'up-left': [['neutral', 61, 369, 1], ['ready', 67, 482, 1], ['happy', 63, 419, 57], ['sad', 65, 463, 73], ['hurt', 70, 543, 60]],
    'up-right': [['neutral', 91, 545, 1], ['ready', 97, 658, 1], ['happy', 93, 595, 57], ['sad', 95, 639, 73], ['hurt', 100, 719, 60]],
  },
  5: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 132, 1], ['happy', 3, 69, 57], ['sad', 5, 113, 73], ['hurt', 10, 193, 60]],
    'down-left': [['neutral', 31, 225, 1], ['ready', 37, 338, 1], ['happy', 33, 275, 57], ['sad', 35, 319, 73], ['hurt', 40, 399, 60]],
    'up-left': [['neutral', 61, 431, 1], ['ready', 67, 544, 1], ['happy', 63, 481, 57], ['sad', 65, 525, 73], ['hurt', 70, 605, 60]],
    'up-right': [['neutral', 91, 637, 1], ['ready', 97, 750, 1], ['happy', 93, 687, 57], ['sad', 95, 731, 74], ['hurt', 100, 811, 60]],
  },
  6: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 109, 1], ['happy', 3, 52, 68], ['sad', 5, 100, 69], ['hurt', 10, 170, 60]],
    'down-left': [['neutral', 31, 172, 1], ['ready', 37, 281, 1], ['happy', 33, 224, 57], ['sad', 35, 272, 69], ['hurt', 40, 342, 60]],
    'up-left': [['neutral', 61, 344, 1], ['ready', 67, 453, 1], ['happy', 63, 396, 57], ['sad', 65, 444, 69], ['hurt', 70, 514, 60]],
    'up-right': [['neutral', 91, 516, 1], ['ready', 97, 625, 1], ['happy', 93, 568, 57], ['sad', 95, 616, 69], ['hurt', 100, 686, 60]],
  },
  7: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 126, 1], ['happy', 3, 63, 57], ['sad', 5, 107, 73], ['hurt', 10, 187, 60]],
    'down-left': [['neutral', 31, 189, 1], ['ready', 37, 298, 1], ['happy', 33, 235, 57], ['sad', 35, 279, 73], ['hurt', 40, 359, 60]],
    'up-left': [['neutral', 61, 361, 1], ['ready', 67, 470, 1], ['happy', 63, 407, 57], ['sad', 65, 451, 73], ['hurt', 70, 531, 60]],
    'up-right': [['neutral', 91, 533, 1], ['ready', 97, 642, 1], ['happy', 93, 579, 57], ['sad', 95, 623, 73], ['hurt', 100, 703, 60]],
  },
  8: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 124, 1], ['happy', 3, 61, 57], ['sad', 5, 105, 73], ['hurt', 10, 183, 33]],
    'down-left': [['neutral', 31, 185, 1], ['ready', 37, 292, 1], ['happy', 33, 229, 57], ['sad', 35, 273, 73], ['hurt', 40, 351, 33]],
    'up-left': [['neutral', 61, 353, 1], ['ready', 67, 461, 1], ['happy', 63, 398, 57], ['sad', 65, 442, 73], ['hurt', 70, 520, 33]],
    'up-right': [['neutral', 91, 522, 1], ['ready', 97, 629, 1], ['happy', 93, 566, 57], ['sad', 95, 610, 73], ['hurt', 100, 688, 33]],
  },
  9: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 126, 1], ['happy', 3, 63, 43], ['sad', 5, 107, 73], ['hurt', 10, 193, 60]],
    'down-left': [['neutral', 31, 195, 1], ['ready', 37, 304, 1], ['happy', 33, 241, 43], ['sad', 35, 285, 73], ['hurt', 40, 371, 60]],
    'up-left': [['neutral', 61, 373, 1], ['ready', 67, 482, 1], ['happy', 63, 419, 43], ['sad', 65, 463, 73], ['hurt', 70, 549, 60]],
    'up-right': [['neutral', 91, 551, 1], ['ready', 97, 660, 1], ['happy', 93, 597, 43], ['sad', 95, 641, 73], ['hurt', 100, 727, 60]],
  },
  10: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 128, 1], ['happy', 3, 65, 46], ['sad', 5, 109, 73], ['hurt', 10, 189, 60]],
    'down-left': [['neutral', 31, 191, 1], ['ready', 37, 302, 1], ['happy', 33, 239, 46], ['sad', 35, 283, 73], ['hurt', 40, 363, 60]],
    'up-left': [['neutral', 61, 365, 1], ['ready', 67, 476, 1], ['happy', 63, 413, 46], ['sad', 65, 457, 73], ['hurt', 70, 537, 60]],
    'up-right': [['neutral', 91, 539, 1], ['ready', 97, 650, 1], ['happy', 93, 587, 46], ['sad', 95, 631, 73], ['hurt', 100, 711, 60]],
  },
  11: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 126, 1], ['happy', 3, 63, 57], ['sad', 5, 107, 73], ['hurt', 10, 187, 60]],
    'down-left': [['neutral', 31, 189, 1], ['ready', 37, 298, 1], ['happy', 33, 235, 57], ['sad', 35, 279, 73], ['hurt', 40, 359, 60]],
    'up-left': [['neutral', 61, 361, 1], ['ready', 67, 470, 1], ['happy', 63, 407, 57], ['sad', 65, 451, 73], ['hurt', 70, 531, 60]],
    'up-right': [['neutral', 91, 533, 1], ['ready', 97, 642, 1], ['happy', 93, 579, 57], ['sad', 95, 623, 73], ['hurt', 100, 709, 60]],
  },
  12: {
    'down-right': [['neutral', 1, 2, 1], ['ready', 7, 128, 1], ['happy', 3, 65, 46], ['sad', 5, 109, 73], ['hurt', 10, 189, 60]],
    'down-left': [['neutral', 31, 191, 1], ['ready', 37, 304, 1], ['happy', 33, 241, 46], ['sad', 35, 285, 73], ['hurt', 40, 367, 60]],
    'up-left': [['neutral', 61, 369, 1], ['ready', 67, 480, 1], ['happy', 63, 417, 46], ['sad', 65, 461, 73], ['hurt', 70, 541, 60]],
    'up-right': [['neutral', 91, 543, 1], ['ready', 97, 654, 1], ['happy', 93, 591, 46], ['sad', 95, 635, 73], ['hurt', 100, 715, 60]],
  },
}

function frame(url: string) {
  return { url, width: 64, height: 96, offsetX: -16, offsetY: -72 }
}

function completeManifest(characterId = 1): ReactionManifest {
  const clips: ReactionClip[] = FACINGS.flatMap(facing =>
    EXPECTED[characterId]![facing].map(([name, sourceRootFrame, sourceSymbol, frames]) => ({
      name,
      facing,
      fps: 30 as const,
      loop: false as const,
      sourceRootFrame,
      sourceSymbol,
      frames: Array.from({ length: frames }, (_, index) =>
        frame(`assets/characters/${characterId}/reactions/${name}/${facing}/${index + 1}.png`)),
    })),
  )
  return {
    version: 1,
    characterId,
    sourceSha256: 'a'.repeat(64),
    clips,
    godOverlays: GOD_IDS.map(godId => ({
      ...frame(`assets/characters/${characterId}/reactions/gods/${godId}.png`),
      godId,
    })),
  }
}

describe('原版角色反馈素材清单', () => {
  it('读取 12 份真实清单并保留各自的完整源时间轴、根帧和 RGBA 文件', () => {
    let pngCount = 0
    for (let characterId = 1; characterId <= 12; characterId++) {
      const path = resolve(ROOT, `public/modern/assets/characters/${characterId}/reactions/manifest.json`)
      const manifest = parseReactionManifest(JSON.parse(readFileSync(path, 'utf8')))
      const sourceHash = createHash('sha256')
        .update(readFileSync(resolve(ROOT, `public/original/star${characterId}.swf`)))
        .digest('hex')

      expect(manifest.characterId).toBe(characterId)
      expect(manifest.sourceSha256).toBe(sourceHash)
      expect(manifest.clips).toHaveLength(20)
      expect(manifest.godOverlays.map(({ godId }) => godId)).toEqual(GOD_IDS)

      for (const facing of FACINGS) {
        for (const [name, sourceRootFrame, sourceSymbol, frameCount] of EXPECTED[characterId]![facing]) {
          const clip = manifest.clips.find(item => item.facing === facing && item.name === name)
          expect(clip, `${characterId}/${facing}/${name}`).toMatchObject({
            name, facing, fps: 30, loop: false, sourceRootFrame, sourceSymbol,
          })
          expect(clip!.frames, `${characterId}/${facing}/${name} source length`).toHaveLength(frameCount)
        }
      }

      const frames = [...manifest.clips.flatMap(({ frames }) => frames), ...manifest.godOverlays]
      expect(new Set(frames.map(({ url }) => url)).size).toBe(frames.length)
      pngCount += frames.length
      for (const item of frames) {
        const png = readFileSync(resolve(ROOT, 'public/modern', item.url))
        expect(png.subarray(1, 4).toString(), item.url).toBe('PNG')
        expect(png.readUInt32BE(16), `${item.url} width`).toBe(item.width)
        expect(png.readUInt32BE(20), `${item.url} height`).toBe(item.height)
        expect(png[25], `${item.url} must be RGBA`).toBe(6)
      }
    }
    expect(pngCount).toBe(8993)
  })

  it('拒绝角色、动作覆盖、源映射、路径和几何漂移', () => {
    expect(() => parseReactionManifest({ ...completeManifest(), characterId: 13 })).toThrow('角色编号错误')

    const missing = completeManifest()
    missing.clips.pop()
    expect(() => parseReactionManifest(missing)).toThrow('必须完整包含 20 个反馈动作')

    const duplicate = completeManifest()
    duplicate.clips[19] = { ...duplicate.clips[0]! }
    expect(() => parseReactionManifest(duplicate)).toThrow('反馈动作重复')

    const wrongSource = completeManifest()
    wrongSource.clips[0]!.sourceSymbol = 999
    expect(() => parseReactionManifest(wrongSource)).toThrow('反馈动作来源定义错误')

    const wrongLength = completeManifest()
    wrongLength.clips.find(({ name }) => name === 'happy')!.frames.pop()
    expect(() => parseReactionManifest(wrongLength)).toThrow('反馈动作来源定义错误')

    const wrongPath = completeManifest()
    wrongPath.clips[0]!.frames[0]!.url = 'assets/characters/2/reactions/neutral/down-right/1.png'
    expect(() => parseReactionManifest(wrongPath)).toThrow('反馈动作帧路径错误')

    const invalidGeometry = completeManifest()
    invalidGeometry.clips[0]!.frames[0]!.offsetY = Number.NaN
    expect(() => parseReactionManifest(invalidGeometry)).toThrow('反馈动作帧定义错误')
  })

  it('拒绝神仙覆盖层缺失、重复、错误顺序或路径', () => {
    const missing = completeManifest()
    missing.godOverlays.pop()
    expect(() => parseReactionManifest(missing)).toThrow('必须完整包含 6 个神仙覆盖层')

    const duplicate = completeManifest()
    duplicate.godOverlays[5] = { ...duplicate.godOverlays[0]! }
    expect(() => parseReactionManifest(duplicate)).toThrow('神仙覆盖层定义错误')

    const wrongPath = completeManifest()
    wrongPath.godOverlays[0]!.url = 'assets/characters/1/reactions/gods/3.png'
    expect(() => parseReactionManifest(wrongPath)).toThrow('神仙覆盖层路径错误')
  })
})

describe('一次性反馈动作游标', () => {
  const clip = completeManifest().clips.find(
    item => item.name === 'happy' && item.facing === 'down-right',
  )!

  it('按 30 fps 前进并在最后一帧保持', () => {
    const player = new ReactionPlayer(clip)
    expect(player.frameIndex).toBe(0)
    player.advance(1000 / 30)
    expect(player.frameIndex).toBe(1)
    player.advance(10_000)
    expect(player.frameIndex).toBe(clip.frames.length - 1)
    expect(player.currentFrame).toBe(clip.frames.at(-1))
    expect(player.finished).toBe(true)
  })

  it('暂停时不前进，速度只缩放视觉时间', () => {
    const player = new ReactionPlayer(clip)
    player.setPaused(true)
    player.advance(1_000)
    expect(player.frameIndex).toBe(0)
    player.setPaused(false)
    player.setSpeed(2)
    player.advance(1000 / 30)
    expect(player.frameIndex).toBe(2)
  })

  it('重置同一或新的片段且拒绝无效时间和速度', () => {
    const player = new ReactionPlayer(clip)
    player.advance(500)
    player.reset()
    expect(player.frameIndex).toBe(0)
    expect(player.currentFrame).toBe(clip.frames[0])

    const hurt = completeManifest().clips.find(
      item => item.name === 'hurt' && item.facing === 'up-left',
    )!
    player.reset(hurt)
    expect(player.clip).toBe(hurt)
    expect(player.frameIndex).toBe(0)
    expect(() => player.setSpeed(0)).toThrow('反馈动作速度必须为正数')
    expect(() => player.advance(-1)).toThrow('反馈动作时间必须为非负数')
  })
})
