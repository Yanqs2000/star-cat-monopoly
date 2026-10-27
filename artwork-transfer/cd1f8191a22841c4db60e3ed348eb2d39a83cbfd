import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import rules from '../../src/modern/data/rules.json'
import { randomInt } from '../../src/modern/features/game/random'
import { createGame } from '../../src/modern/features/game/setup'
import type { Direction, GameState } from '../../src/modern/features/game/types'
import { nextTurn, roll, step } from '../../src/modern/features/game/turns'

const move = {
  1: { column: 1, row: 1 },
  2: { column: -1, row: 1 },
  3: { column: -1, row: -1 },
  4: { column: 1, row: -1 },
} as const
const reverse = { 1: 3, 2: 4, 3: 1, 4: 2 } as const

function withFirstPlayer(state: GameState, column: number, row: number, direction: Direction): GameState {
  return {
    ...state,
    players: state.players.map((player, index) =>
      index === 0 ? { ...player, position: { column, row }, direction } : player),
  }
}

describe('现代规则数据生成', () => {
  it('从原表生成完整且有来源校验的最小道路规则', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starcat-rules-'))
    try {
      const output = join(dir, 'rules.json')
      const result = spawnSync(process.execPath, ['scripts/build-modern-rules.mjs', '--output', output], { encoding: 'utf8' })
      expect(result.status, result.stderr).toBe(0)
      const generated = JSON.parse(readFileSync(output, 'utf8'))
      expect(generated.sourceSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(generated.initialFunds).toEqual({ cash: 100000, deposit: 100000 })
      expect(generated.spawnRegions).toEqual([
        { id: 1, variants: [{ direction: 1, position: { column: 34, row: 8 } }, { direction: 3, position: { column: 33, row: 7 } }] },
        { id: 2, variants: [{ direction: 2, position: { column: 29, row: 33 } }, { direction: 4, position: { column: 30, row: 32 } }] },
        { id: 3, variants: [{ direction: 1, position: { column: 7, row: 35 } }, { direction: 3, position: { column: 6, row: 34 } }] },
        { id: 4, variants: [{ direction: 2, position: { column: 10, row: 10 } }, { direction: 4, position: { column: 11, row: 9 } }] },
      ])
      expect(generated.junctions['227']).toEqual([1, 4, 3])
      expect(generated.reentryOrigins).toEqual({
        hospital: { direction: 2, position: { column: 19, row: 1 } },
        jail: { direction: 4, position: { column: 21, row: 41 } },
      })
      expect(generated.roadCells).toHaveLength(160)
      expect(generated.roadCells.find((cell: { id: number }) => cell.id === 221)).toEqual({
        id: 221, coordinate: { column: 35, row: 9 }, kind: 29, name: '三岔路口',
      })
      expect(Object.keys(generated)).toEqual(['sourceSha256', 'initialFunds', 'spawnRegions', 'reentryOrigins', 'junctions', 'roadCells'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('确定性规则随机数', () => {
  it('把种子0作为有效uint32状态并返回可复现的字面结果', () => {
    const first = randomInt(0, 6)
    const second = randomInt(first.nextState, 6)
    expect(first).toEqual({ value: 1, nextState: 1013904223 })
    expect(second).toEqual({ value: 1, nextState: 1196435762 })
    expect(randomInt(0, 6)).toEqual(first)
  })

  it('拒绝无效状态和上界', () => {
    expect(() => randomInt(-1, 6)).toThrow()
    expect(() => randomInt(1, 0)).toThrow()
    expect(() => randomInt(1, 1.5)).toThrow()
  })
})

describe('纯开局规则', () => {
  it('保留人类选择顺序、随机补满AI，并分配不重复出生区和原版初值', () => {
    const game = createGame([4, 1], 0)
    expect(game.players).toHaveLength(4)
    expect(game.players.slice(0, 2).map(player => [player.characterId, player.controller, player.name])).toEqual([
      [4, 'human', '佳佳'],
      [1, 'human', '卷毛'],
    ])
    expect(game.players.slice(2).every(player => player.controller === 'ai')).toBe(true)
    expect(new Set(game.players.map(player => player.characterId)).size).toBe(4)
    expect(new Set(game.players.map(player => player.hometown))).toEqual(new Set([1, 2, 3, 4]))
    expect(game.players.every(player => player.cash === 100000 && player.deposit === 100000)).toBe(true)
    expect(game).toMatchObject({ activePlayerIndex: 0, round: 1, phase: 'awaiting-roll', remainingSteps: 0, lastRoll: null, turnPath: [] })
  })

  it.each([
    [[]],
    [[1, 1]],
    [[0]],
    [[13]],
    [[1, 2, 3, 4, 5]],
  ])('拒绝无效角色选择 %j', selection => {
    expect(() => createGame(selection, 1)).toThrow()
  })

  it('拒绝非uint32种子', () => {
    expect(() => createGame([1], -1)).toThrow()
    expect(() => createGame([1], 2 ** 32)).toThrow()
  })

  it('相同种子和选择生成完全相同状态', () => {
    expect(createGame([1, 2], 42)).toEqual(createGame([1, 2], 42))
  })
})

describe('纯移动与轮转规则', () => {
  it.each([
    ['医院', 19, 1, 2, 18, 2],
    ['监狱', 21, 41, 4, 22, 40],
  ] as const)('从%s释放点按原方向走入第一格道路', (_name, column, row, direction, nextColumn, nextRow) => {
    const source = withFirstPlayer(createGame([1, 2, 3, 4], 1), column, row, direction)
    const landed = step(roll(source, 1))
    expect(landed.players[0]).toMatchObject({
      position: { column: nextColumn, row: nextRow },
      direction,
    })
    expect(landed.turnPath).toEqual([
      { column, row },
      { column: nextColumn, row: nextRow },
    ])
  })

  it('最后一步抵达221三岔路仍先按原方向顺序转向再落地', () => {
    const source = withFirstPlayer(createGame([1, 2, 3, 4], 1), 34, 8, 1)
    const moving = roll(source, 1)
    const landed = step(moving)
    expect(landed.players[0]).toMatchObject({ position: { column: 35, row: 9 } })
    expect([1, 2]).toContain(landed.players[0]!.direction)
    expect(landed).toMatchObject({ remainingSteps: 0, phase: 'landed', turnPath: [{ column: 34, row: 8 }, { column: 35, row: 9 }] })
    expect(source.players[0]!.position).toEqual({ column: 34, row: 8 })
    expect(source.turnPath).toEqual([])
  })

  it('从区域3的另一出生姿态抵达225三岔路时排除反向1', () => {
    const source = withFirstPlayer(createGame([1, 2, 3, 4], 3), 6, 34, 3)
    const landed = step(roll(source, 1))
    expect(landed.players[0]!.position).toEqual({ column: 5, row: 33 })
    expect([3, 4]).toContain(landed.players[0]!.direction)
  })

  it('街道转角只剩一个合法出口时仍消耗一次路口随机', () => {
    const source = withFirstPlayer(createGame([1, 2, 3, 4], 17), 13, 9, 3)
    const moving = roll(source, 1)
    const expected = randomInt(moving.rngState, 1)
    const landed = step(moving)
    expect(landed.players[0]).toMatchObject({ position: { column: 12, row: 8 }, direction: 2 })
    expect(landed.rngState).toBe(expected.nextState)
  })

  it('固定六点恰好移动六格，且每次转换都不修改来源状态', () => {
    let game = withFirstPlayer(createGame([1, 2, 3, 4], 7), 34, 8, 1)
    const beforeRoll = structuredClone(game)
    game = roll(game, 6)
    expect(beforeRoll).toEqual(withFirstPlayer(createGame([1, 2, 3, 4], 7), 34, 8, 1))
    const movingSnapshot = structuredClone(game)
    for (let count = 0; count < 6; count += 1) game = step(game)
    expect(movingSnapshot.remainingSteps).toBe(6)
    expect(game.turnPath).toHaveLength(7)
    expect(game.remainingSteps).toBe(0)
    expect(game.phase).toBe('landed')
  })

  it('普通骰消耗一次随机，固定回放骰不消耗骰子随机', () => {
    const source = createGame([1, 2, 3, 4], 11)
    const ordinary = roll(source)
    const expected = randomInt(source.rngState, 6)
    expect(ordinary).toMatchObject({ lastRoll: expected.value + 1, rngState: expected.nextState })
    expect(roll(source, 4)).toMatchObject({ lastRoll: 4, rngState: source.rngState })
  })

  it('拒绝错误阶段和无效固定骰命令且不修改状态', () => {
    const source = createGame([1, 2, 3, 4], 5)
    const snapshot = structuredClone(source)
    expect(() => roll(source, 0)).toThrow()
    expect(() => roll(source, 7)).toThrow()
    expect(() => roll(source, 1.5)).toThrow()
    expect(() => step(source)).toThrow()
    const moving = roll(source, 1)
    expect(() => roll(moving)).toThrow()
    const landed = step(moving)
    expect(() => step(landed)).toThrow()
    expect(() => nextTurn(source)).toThrow()
    expect(source).toEqual(snapshot)
  })

  it('四名玩家依次轮转且第四人结束后进入第二回合', () => {
    let game = createGame([1, 2, 3, 4], 9)
    for (let player = 0; player < 4; player += 1) {
      game = step(roll(game, 1))
      game = nextTurn(game)
      expect(game.activePlayerIndex).toBe((player + 1) % 4)
    }
    expect(game.round).toBe(2)
    expect(game.phase).toBe('awaiting-roll')
  })

  it('相同种子和命令流包含路口分支时得到完全相同状态', () => {
    const play = () => {
      let game = withFirstPlayer(createGame([1], 123456), 34, 8, 1)
      game = roll(game, 3)
      while (game.phase === 'moving') game = step(game)
      return nextTurn(game)
    }
    expect(play()).toEqual(play())
  })
})

describe('原版道路拓扑闭包', () => {
  it('从8个出生姿态穷举308个位置朝向状态且不走入景物格', () => {
    const cells = new Map(rules.roadCells.map(cell => [`${cell.coordinate.column},${cell.coordinate.row}`, cell]))
    const queue = rules.spawnRegions.flatMap(region => region.variants.map(variant => ({ ...variant.position, direction: variant.direction as Direction })))
    const visited = new Set<string>()
    const positions = new Set<string>()
    while (queue.length > 0) {
      const current = queue.shift()!
      const stateKey = `${current.column},${current.row},${current.direction}`
      if (visited.has(stateKey)) continue
      visited.add(stateKey)
      positions.add(`${current.column},${current.row}`)
      const delta = move[current.direction]
      const column = current.column + delta.column
      const row = current.row + delta.row
      const cell = cells.get(`${column},${row}`)
      expect(cell, `missing road at ${column},${row}`).toBeDefined()
      const exits = rules.junctions[String(cell!.id) as keyof typeof rules.junctions] as Direction[] | undefined
      const directions = exits ? exits.filter(direction => direction !== reverse[current.direction]) : [current.direction]
      expect(directions.length, `dead path at road ${cell!.id}`).toBeGreaterThan(0)
      for (const direction of directions) queue.push({ column, row, direction })
    }
    expect(visited.size).toBe(308)
    expect(positions.size).toBe(146)
  })

  it('从8个出生姿态及医院监狱释放点穷举322个位置朝向状态和160格道路', () => {
    const cells = new Map(rules.roadCells.map(cell => [`${cell.coordinate.column},${cell.coordinate.row}`, cell]))
    const reentryOrigins = Object.values(rules.reentryOrigins)
    const queue = [
      ...rules.spawnRegions.flatMap(region => region.variants.map(variant => ({ ...variant.position, direction: variant.direction as Direction }))),
      ...reentryOrigins.map(origin => ({ ...origin.position, direction: origin.direction as Direction })),
    ]
    const visited = new Set<string>()
    const positions = new Set<string>()
    while (queue.length > 0) {
      const current = queue.shift()!
      const stateKey = `${current.column},${current.row},${current.direction}`
      if (visited.has(stateKey)) continue
      visited.add(stateKey)
      positions.add(`${current.column},${current.row}`)
      const delta = move[current.direction]
      const column = current.column + delta.column
      const row = current.row + delta.row
      const cell = cells.get(`${column},${row}`)
      expect(cell, `missing road at ${column},${row}`).toBeDefined()
      const exits = rules.junctions[String(cell!.id) as keyof typeof rules.junctions] as Direction[] | undefined
      const directions = exits ? exits.filter(direction => direction !== reverse[current.direction]) : [current.direction]
      expect(directions.length, `dead path at road ${cell!.id}`).toBeGreaterThan(0)
      for (const direction of directions) queue.push({ column, row, direction })
    }
    expect(visited.size).toBe(322)
    expect(positions.size).toBe(160)
  })
})
