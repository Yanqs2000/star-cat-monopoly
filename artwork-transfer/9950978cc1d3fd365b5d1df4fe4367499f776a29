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
const rulesPath = option('--rules', resolve(root, 'src/modern/data/rules.json'))
const outputPath = option('--output', resolve(root, 'src/modern/data/events.json'))
const source = readFileSync(resolve(root, 'public/original/play.swf'))
const sourceSha256 = createHash('sha256').update(source).digest('hex')
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== sourceSha256) {
  throw new Error('原版 play.swf 校验失败')
}

const tables = JSON.parse(readFileSync(tablesPath, 'utf8'))
const rules = JSON.parse(readFileSync(rulesPath, 'utf8'))
if (rules.sourceSha256 !== sourceSha256) throw new Error('道路规则与原版来源不一致')

const sourceEvents = tables.luckdate?.value
if (!Array.isArray(sourceEvents) || sourceEvents.length !== 42) throw new Error('运气事件原表必须包含占位0和事件1至41')
const events = sourceEvents.slice(1).map((row, index) => {
  if (!Array.isArray(row) || ![1, 2].includes(row[0]) || typeof row[1] !== 'string' || !Number.isFinite(row[2])) {
    throw new Error(`运气事件 ${index + 1} 格式错误`)
  }
  const id = index + 1
  const sourceAmount = row[2]
  return {
    id,
    kind: row[0] === 1 ? 'cash' : 'tickets',
    description: row[1],
    sourceAmount,
    amount: id === 28 ? -1000 : sourceAmount,
    ...(id === 28 ? { correction: 'B-01' } : {}),
  }
})

const buildings = tables.builddate1?.value
const grid = tables.mapdate1?.value
if (!Array.isArray(buildings) || !Array.isArray(grid)) throw new Error('原地图特殊格数据缺失')
const specialKinds = new Map([[20, 'shop'], [24, 'card'], [25, 'luck'], [26, 'tickets']])
const roadCells = new Map(rules.roadCells.map(cell => [cell.id, cell]))
const landings = []

for (let id = 0; id < buildings.length; id += 1) {
  const record = buildings[id]
  if (!Array.isArray(record) || !specialKinds.has(record[1]) || !roadCells.has(id)) continue
  const roadCell = roadCells.get(id)
  const column = record[13]
  const row = record[14]
  if (!Number.isInteger(column) || !Number.isInteger(row) || grid[row]?.[column] !== id ||
      roadCell.kind !== record[1] || roadCell.coordinate?.column !== column || roadCell.coordinate?.row !== row) {
    throw new Error(`特殊格 ${id} 的道路闭包或坐标错误`)
  }
  const landing = { id, position: { column, row }, kind: specialKinds.get(record[1]) }
  if (record[1] === 26) {
    if (![10, 30, 50].includes(record[8])) throw new Error(`奖券格 ${id} 金额错误`)
    landing.ticketAmount = record[8]
  }
  landings.push(landing)
}

const result = { sourceSha256, events, landings }
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(`已生成 ${events.length} 个运气事件和 ${landings.length} 个可达特殊格`)
