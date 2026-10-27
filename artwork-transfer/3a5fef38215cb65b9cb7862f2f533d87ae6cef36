import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('原版地图转换', () => {
  it('将112条住宅记录配成56块地并保留实际坐标、街道和价格', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starcat-map-'))
    try {
      const path = join(dir, 'map.json')
      const result = spawnSync(process.execPath, ['scripts/build-modern-map.mjs', '--output', path], { encoding: 'utf8' })
      expect(result.status, result.stderr).toBe(0)
      const map = JSON.parse(readFileSync(path, 'utf8'))
      expect([map.rows, map.columns, map.parcels.length]).toEqual([43, 41, 56])
      expect(new Set(map.parcels.map((p: { streetId: number }) => p.streetId)).size).toBe(16)
      expect(map.parcels[0]).toEqual({ id: 1, roadCell: { column: 6, row: 32 }, buildingCell: { column: 5, row: 31 }, streetId: 1, streetName: '金星大道', basePrice: 1500, facing: 3 })
      expect(map.grid[32][6]).toBe(1)
      expect(map.grid[31][5]).toBe(2)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  it('发现住宅配对坐标与原网格不一致时拒绝输出', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starcat-map-'))
    try {
      const tables = JSON.parse(readFileSync('docs/modernization/evidence/original-tables.json', 'utf8'))
      tables.builddate1.value[2][13] = 0
      const path = join(dir, 'tables.json')
      writeFileSync(path, JSON.stringify(tables))
      const result = spawnSync(process.execPath, ['scripts/build-modern-map.mjs', '--tables', path, '--output', join(dir, 'out.json')], { encoding: 'utf8' })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('地块 1')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})
