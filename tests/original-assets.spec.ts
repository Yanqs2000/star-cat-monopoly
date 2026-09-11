import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

describe('原版资源完整性', () => {
  it('主程序不能缺失或被服务器错误页替代', () => {
    const path = resolve('public/original/play.swf')
    expect(existsSync(path), '原版主程序尚未接入').toBe(true)
    const bytes = readFileSync(path)
    expect(bytes.subarray(0, 3).toString()).toBe('CWS')
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba')
  })
  it('资源清单内的全部 SWF 均完整且保持原字节', () => {
    const path = resolve('public/original/manifest.json')
    expect(existsSync(path), '缺少依赖资源清单').toBe(true)
    const manifest = JSON.parse(readFileSync(path, 'utf8')) as { files: Array<{ name: string; bytes: number; sha256: string }> }
    expect(manifest.files.length).toBeGreaterThan(1)
    for (const file of manifest.files) {
      const bytes = readFileSync(resolve('public/original', file.name))
      expect(bytes.length, file.name).toBe(file.bytes)
      expect(createHash('sha256').update(bytes).digest('hex'), file.name).toBe(file.sha256)
      expect(['CWS', 'FWS']).toContain(bytes.subarray(0, 3).toString())
      const body = bytes.subarray(0, 3).toString() === 'CWS' ? inflateSync(bytes.subarray(8)) : bytes.subarray(8)
      expect(body.length + 8, file.name).toBe(bytes.readUInt32LE(4))
    }
  })
})
