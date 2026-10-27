import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
const outputPath = option('--output', resolve(root, 'src/modern/data/card-board.json'))
const swf = readFileSync(resolve(root, 'public/original/play.swf'))
const sourceSha256 = createHash('sha256').update(swf).digest('hex')
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== sourceSha256) {
  throw new Error('原版 play.swf 校验失败')
}

const tables = JSON.parse(readFileSync(tablesPath, 'utf8'))
const grid = tables.mapdate1?.value
const buildings = tables.builddate1?.value
if (!Array.isArray(grid) || grid.length !== 43 || grid.some(row => !Array.isArray(row) || row.length !== 41)) {
  throw new Error('原地图必须为43×41')
}
if (!Array.isArray(buildings) || buildings.length !== 235 || buildings.some(record => !Array.isArray(record) || record.length < 15)) {
  throw new Error('原地图记录必须为235条')
}

for (let row = 0; row < grid.length; row += 1) {
  for (let column = 0; column < grid[row].length; column += 1) {
    const id = grid[row][column]
    if (!Number.isInteger(id) || id < 0 || id >= buildings.length) throw new Error(`网格(${column},${row})记录ID无效`)
  }
}
for (let id = 1; id < buildings.length; id += 1) {
  const record = buildings[id]
  const column = record[13]
  const row = record[14]
  if (column === 0 && row === 0) continue
  if (grid[row]?.[column] !== id) throw new Error(`记录${id}与原网格坐标不一致`)
}

const parcelPairs = []
for (let id = 1; id < buildings.length; id += 1) {
  const road = buildings[id]
  if (road[1] !== 16 || road[3] % 2 !== 1) continue
  const building = buildings[id + 1]
  if (!building || building[1] !== 16 || building[2] !== road[2] || building[3] !== road[3] + 1) {
    throw new Error(`住宅记录${id}缺少配对建筑格`)
  }
  parcelPairs.push({ parcelId: id, roadRecordId: id, buildingRecordId: id + 1 })
}
if (parcelPairs.length !== 56) throw new Error('住宅地块配对数量不是56')

const tuple = (name) => {
  const value = tables[name]?.value
  if (!Array.isArray(value) || value.length !== 3 || value.some(item => !Number.isInteger(item))) {
    throw new Error(`${name}元数据无效`)
  }
  return value
}

const result = {
  rows: grid.length,
  columns: grid[0].length,
  grid,
  records: buildings.map((record, id) => ({
    id,
    type: record[1],
    ordinal: record[3],
    streetId: record[2],
    facing: record[6],
    position: { column: record[13], row: record[14] },
  })),
  parcelPairs,
  hospital: tuple('hospitaldate'),
  jail: tuple('jaildate'),
  initialOwnerZeroDeposit: 100_000,
  sourceSha256,
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(`已生成 ${result.records.length} 条源记录和 ${parcelPairs.length} 对住宅映射`)
