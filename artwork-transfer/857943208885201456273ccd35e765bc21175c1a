import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import catalog from '../../src/modern/data/events.json'
import {
  applyLuckEvent,
  applyTicketLanding,
  drawLuckEvent,
  findSpecialLanding,
  getLuckEvent,
} from '../../src/modern/features/game/events'

const tables = JSON.parse(readFileSync('docs/modernization/evidence/original-tables.json', 'utf8'))
const sourceRows = tables.luckdate.value.slice(1) as Array<[1 | 2, string, number]>
const reachableSpecialIds = [
  149, 150, 151, 152,
  166, 167, 168, 169,
  172, 173, 174, 176,
  181, 182, 183, 184, 185, 186, 187,
  190, 191, 192, 193, 194, 197, 198,
]

describe('现代事件数据生成', () => {
  it('从原表复现全部41个事件，只对B-01使用修正后的有效金额', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starcat-events-'))
    try {
      const output = join(dir, 'events.json')
      const result = spawnSync(process.execPath, ['scripts/build-modern-events.mjs', '--output', output], { encoding: 'utf8' })
      expect(result.status, result.stderr).toBe(0)
      const generated = JSON.parse(readFileSync(output, 'utf8'))
      const sourceHash = createHash('sha256').update(readFileSync('public/original/play.swf')).digest('hex')
      const manifest = JSON.parse(readFileSync('public/original/manifest.json', 'utf8'))

      expect(generated).toEqual(catalog)
      expect(generated.sourceSha256).toBe(sourceHash)
      expect(generated.sourceSha256).toBe(manifest.files.find((file: { name: string }) => file.name === 'play.swf').sha256)
      expect(generated.events).toHaveLength(41)
      expect(generated.events.map((event: { id: number }) => event.id)).toEqual(Array.from({ length: 41 }, (_, index) => index + 1))

      sourceRows.forEach(([type, description, sourceAmount], index) => {
        const id = index + 1
        expect(generated.events[index]).toEqual({
          id,
          kind: type === 1 ? 'cash' : 'tickets',
          description,
          sourceAmount,
          amount: id === 28 ? -1000 : sourceAmount,
          ...(id === 28 ? { correction: 'B-01' } : {}),
        })
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('只生成道路闭包中坐标与原网格一致的特殊格', () => {
    expect(catalog.landings.map(landing => landing.id).sort((a, b) => a - b)).toEqual(reachableSpecialIds)
    for (const landing of catalog.landings) {
      const source = tables.builddate1.value[landing.id]
      expect(source[1]).toBe([20, 24, 25, 26][['shop', 'card', 'luck', 'tickets'].indexOf(landing.kind)])
      expect(landing.position).toEqual({ column: source[13], row: source[14] })
      expect(tables.mapdate1.value[source[14]][source[13]]).toBe(landing.id)
    }
  })

  it('发现特殊格记录坐标与原网格不一致时拒绝生成', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starcat-events-'))
    try {
      const changedTables = structuredClone(tables)
      changedTables.builddate1.value[181][13] = 0
      const tablesPath = join(dir, 'tables.json')
      writeFileSync(tablesPath, JSON.stringify(changedTables))
      const result = spawnSync(process.execPath, [
        'scripts/build-modern-events.mjs', '--tables', tablesPath, '--output', join(dir, 'events.json'),
      ], { encoding: 'utf8' })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('特殊格 181')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('运气事件目录与随机抽取', () => {
  it('返回完整事件且调用方不能改写目录', () => {
    expect(getLuckEvent(1)).toEqual({
      id: 1,
      kind: 'cash',
      description: '公共场所随地吐痰，被罚款500元',
      sourceAmount: -500,
      amount: -500,
    })
    const changed = getLuckEvent(1)
    changed.amount = 999
    expect(getLuckEvent(1).amount).toBe(-500)
  })

  it('拒绝占位、越界和非整数事件ID', () => {
    expect(() => getLuckEvent(0)).toThrow()
    expect(() => getLuckEvent(42)).toThrow()
    expect(() => getLuckEvent(1.5)).toThrow()
  })

  it('每次抽取只推进一次既有随机源并可确定性复现', () => {
    expect(drawLuckEvent(0)).toEqual({ event: getLuckEvent(10), rngState: 1013904223 })
    expect(drawLuckEvent(1013904223)).toEqual({ event: getLuckEvent(12), rngState: 1196435762 })
    expect(drawLuckEvent(0)).toEqual(drawLuckEvent(0))
    expect(() => drawLuckEvent(-1)).toThrow()
  })
})

describe('纯运气事件结算', () => {
  it('现金损失可为负、不动存款，并把完整损失加入两份失物招领余额', () => {
    const wallet = { cash: 100, deposit: 2000, tickets: 20 }
    const funds: [number, number] = [0, 0]
    const result = applyLuckEvent(wallet, 1, funds)
    expect(result).toEqual({
      wallet: { cash: -400, deposit: 2000, tickets: 20 },
      lostAndFoundFunds: [500, 500],
      event: getLuckEvent(1),
      insolvent: false,
    })
    expect(wallet).toEqual({ cash: 100, deposit: 2000, tickets: 20 })
    expect(funds).toEqual([0, 0])
  })

  it('B-01保留原1000并实际扣1000，得到100000到99000及双份失物招领', () => {
    const result = applyLuckEvent({ cash: 100000, deposit: 0, tickets: 0 }, 28, [0, 0])
    expect(result.event).toMatchObject({ sourceAmount: 1000, amount: -1000, correction: 'B-01' })
    expect(result.wallet.cash).toBe(99000)
    expect(result.lostAndFoundFunds).toEqual([1000, 1000])
  })

  it('现金奖励直接增加现金且不增加失物招领', () => {
    expect(applyLuckEvent({ cash: 100, deposit: 2000, tickets: 20 }, 11, [7, 9])).toEqual({
      wallet: { cash: 20100, deposit: 2000, tickets: 20 },
      lostAndFoundFunds: [7, 9],
      event: getLuckEvent(11),
      insolvent: false,
    })
  })

  it('奖券事件直接增减且低余额不会截断为零', () => {
    expect(applyLuckEvent({ cash: 100, deposit: 2000, tickets: 20 }, 21, [0, 0]).wallet.tickets).toBe(120)
    expect(applyLuckEvent({ cash: 100, deposit: 2000, tickets: 20 }, 37, [0, 0]).wallet).toEqual({
      cash: 100, deposit: 2000, tickets: -80,
    })
  })

  it('现金和存款之和不大于零时标记资金不足', () => {
    expect(applyLuckEvent({ cash: 100, deposit: 400, tickets: 0 }, 1, [0, 0]).insolvent).toBe(true)
    expect(applyLuckEvent({ cash: -401, deposit: 400, tickets: 0 }, 11, [0, 0]).insolvent).toBe(false)
  })
})

describe('真实特殊格与奖券结算', () => {
  it('识别道路闭包中真实的商店、卡片、运气和10/30/50奖券格', () => {
    expect(findSpecialLanding({ column: 8, row: 12 })).toEqual({ id: 149, position: { column: 8, row: 12 }, kind: 'shop' })
    expect(findSpecialLanding({ column: 19, row: 17 })).toEqual({ id: 166, position: { column: 19, row: 17 }, kind: 'card' })
    expect(findSpecialLanding({ column: 22, row: 14 })).toEqual({ id: 172, position: { column: 22, row: 14 }, kind: 'luck' })
    expect(findSpecialLanding({ column: 4, row: 24 })).toMatchObject({ id: 181, kind: 'tickets', ticketAmount: 10 })
    expect(findSpecialLanding({ column: 37, row: 17 })).toMatchObject({ id: 190, kind: 'tickets', ticketAmount: 30 })
    expect(findSpecialLanding({ column: 34, row: 18 })).toMatchObject({ id: 198, kind: 'tickets', ticketAmount: 50 })
  })

  it('排除道路闭包外的原表特殊格和占位坐标', () => {
    expect(findSpecialLanding({ column: 14, row: 6 })).toBeUndefined()
    expect(findSpecialLanding({ column: 18, row: 2 })).toBeUndefined()
    expect(findSpecialLanding({ column: 0, row: 0 })).toBeUndefined()
    expect(findSpecialLanding({ column: 5, row: 5 })).toBeUndefined()
  })

  it('奖券格按地图字面值结算且不修改输入', () => {
    const wallet = { cash: -50, deposit: 20, tickets: 5 }
    expect(applyTicketLanding(wallet, { column: 4, row: 24 })).toEqual({
      wallet: { cash: -50, deposit: 20, tickets: 15 }, amount: 10,
    })
    expect(applyTicketLanding(wallet, { column: 37, row: 17 }).amount).toBe(30)
    expect(applyTicketLanding(wallet, { column: 34, row: 18 }).amount).toBe(50)
    expect(wallet).toEqual({ cash: -50, deposit: 20, tickets: 5 })
  })

  it('拒绝非奖券格和不可达奖券记录', () => {
    expect(() => applyTicketLanding({ cash: 1, deposit: 2, tickets: 3 }, { column: 22, row: 14 })).toThrow()
    expect(() => applyTicketLanding({ cash: 1, deposit: 2, tickets: 3 }, { column: 14, row: 6 })).toThrow()
  })
})
