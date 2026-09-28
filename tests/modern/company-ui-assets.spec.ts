import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('公司对话框只保留原 show 第20帧画面，原坐标与透明边界未缩放', () => {
  const root = resolve(import.meta.dirname, '../..')
  const manifest = JSON.parse(readFileSync(resolve(root, 'public/modern/assets/companies/dialog.json'), 'utf8'))
  expect(manifest).toMatchObject({ sourceSha256: '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba',
    sourceSpriteId: 1515, sourceFrame: 20, retainedDepths: [1, 3],
    boundsTwips: [-3960, 3960, -3480, 3400], width: 408, height: 356,
    rasterFilterPadding: 6, offsetX: -204, offsetY: -180 })
  const png = readFileSync(resolve(root, 'public/modern/assets/companies/dialog.png'))
  expect(png.readUInt32BE(16)).toBe(408)
  expect(png.readUInt32BE(20)).toBe(356)
  expect(png[25]).toBe(6)
})
