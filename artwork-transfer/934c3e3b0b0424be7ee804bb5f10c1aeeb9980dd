import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const args = process.argv.slice(2)
function option(name, fallback) {
  const index = args.indexOf(name)
  if (index < 0) return fallback
  if (!args[index + 1]) throw new Error(`${name} requires a path`)
  return resolve(args[index + 1])
}
const tablesPath = option('--tables', resolve(root, 'docs/modernization/evidence/original-tables.json'))
const outputPath = option('--output', resolve(root, 'src/modern/data/map.json'))
const source = readFileSync(resolve(root, 'public/original/play.swf'))
const sourceSha256 = createHash('sha256').update(source).digest('hex')
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== sourceSha256) throw new Error('原版 play.swf 校验失败')
const tables = JSON.parse(readFileSync(tablesPath, 'utf8'))
const grid = tables.mapdate1.value
const buildings = tables.builddate1.value
if (grid.length !== 43 || grid.some(row => row.length !== 41)) throw new Error('原地图必须为43×41')
const parcels = []
for (let id = 1; id < buildings.length; id++) {
  const record = buildings[id]
  if (record[1] !== 16 || record[3] % 2 !== 1) continue
  const pair = buildings[id + 1]
  if (!pair || pair[1] !== 16 || pair[2] !== record[2] || pair[3] !== record[3] + 1 ||
      grid[record[14]]?.[record[13]] !== id || grid[pair[14]]?.[pair[13]] !== id + 1 ||
      ![1, 2, 3, 4].includes(record[6])) throw new Error(`地块 ${id} 的道路/建筑配对或坐标错误`)
  parcels.push({ id, roadCell: { column: record[13], row: record[14] }, buildingCell: { column: pair[13], row: pair[14] }, streetId: record[2], streetName: record[7], basePrice: record[8], facing: record[6] })
}
if (parcels.length !== 56) throw new Error('住宅地块数量不是56')
const result = { rows: grid.length, columns: grid[0].length, grid, parcels, sourceSha256 }
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(`已生成 ${parcels.length} 块住宅地，${new Set(parcels.map(p => p.streetId)).size} 条街道`)
