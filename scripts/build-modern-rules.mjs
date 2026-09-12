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
const outputPath = option('--output', resolve(root, 'src/modern/data/rules.json'))
const swf = readFileSync(resolve(root, 'public/original/play.swf'))
const sourceSha256 = createHash('sha256').update(swf).digest('hex')
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== sourceSha256) {
  throw new Error('原版 play.swf 校验失败')
}

const tables = JSON.parse(readFileSync(tablesPath, 'utf8'))
const map = tables.mapdate1?.value
const buildings = tables.builddate1?.value
const starts = tables.startpdate?.value
const initialMoney = tables.money_1st?.value
if (!Array.isArray(map) || !Array.isArray(buildings) || !Array.isArray(starts) || !Array.isArray(initialMoney)) {
  throw new Error('原表缺少地图、道路、出生区或初始资金')
}

const spawnRegions = [1, 2, 3, 4].map(id => {
  const region = starts[id]
  if (!Array.isArray(region) || !Array.isArray(region[0]) || !Array.isArray(region[1])) {
    throw new Error(`出生区 ${id} 结构错误`)
  }
  const variants = region.slice(0, 2).map(([direction, column, row]) => {
    if (![1, 2, 3, 4].includes(direction) || !Number.isInteger(column) || !Number.isInteger(row)) {
      throw new Error(`出生区 ${id} 坐标错误`)
    }
    return { direction, position: { column, row } }
  })
  return { id, variants }
})

const junctions = {}
for (let id = 1; id < buildings.length; id += 1) {
  const record = buildings[id]
  if (!Array.isArray(record)) continue
  if (Array.isArray(record[6])) {
    if (record[6].length === 0 || record[6].some(direction => ![1, 2, 3, 4].includes(direction))) {
      throw new Error(`路口 ${id} 方向错误`)
    }
    junctions[id] = record[6]
  }
}
if (Object.keys(junctions).length !== 28) throw new Error('路口数量不是28')
if (initialMoney[1] !== 100000 || initialMoney[2] !== 100000) throw new Error('原版初始资金不符')

const movement = { 1: [1, 1], 2: [-1, 1], 3: [-1, -1], 4: [1, -1] }
const reverse = { 1: 3, 2: 4, 3: 1, 4: 2 }
const queue = spawnRegions.flatMap(region =>
  region.variants.map(variant => ({ ...variant.position, direction: variant.direction })))
const reachableStates = new Set()
const reachableCells = new Map()
while (queue.length > 0) {
  const current = queue.shift()
  const stateKey = `${current.column},${current.row},${current.direction}`
  if (reachableStates.has(stateKey)) continue
  reachableStates.add(stateKey)
  const currentId = map[current.row]?.[current.column]
  if (!Number.isInteger(currentId) || currentId <= 0 || currentId === 233 || !buildings[currentId]) {
    throw new Error(`道路闭包进入无效格 ${current.column},${current.row}`)
  }
  reachableCells.set(`${current.column},${current.row}`, { id: currentId, coordinate: { column: current.column, row: current.row } })
  const [dc, dr] = movement[current.direction]
  const column = current.column + dc
  const row = current.row + dr
  const nextId = map[row]?.[column]
  if (!Number.isInteger(nextId) || nextId <= 0 || nextId === 233 || !buildings[nextId]) {
    throw new Error(`道路闭包进入无效格 ${column},${row}`)
  }
  const exits = junctions[nextId]
  const directions = exits ? exits.filter(direction => direction !== reverse[current.direction]) : [current.direction]
  if (directions.length === 0) throw new Error(`路口 ${nextId} 没有合法出口`)
  for (const direction of directions) queue.push({ column, row, direction })
}
if (reachableStates.size !== 308 || reachableCells.size !== 146) {
  throw new Error(`道路闭包应为308个状态/146格，实际为${reachableStates.size}/${reachableCells.size}`)
}
const roadCells = [...reachableCells.values()]
  .sort((a, b) => a.coordinate.row - b.coordinate.row || a.coordinate.column - b.coordinate.column)
  .map(cell => {
    const record = buildings[cell.id]
    if (!Number.isInteger(record[1]) || typeof record[7] !== 'string') throw new Error(`道路格 ${cell.id} 结构错误`)
    return { ...cell, kind: record[1], name: record[7] }
  })

const result = {
  sourceSha256,
  initialFunds: { cash: initialMoney[1], deposit: initialMoney[2] },
  spawnRegions,
  junctions,
  roadCells,
}
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(`已生成 ${roadCells.length} 个可达道路格、${Object.keys(junctions).length} 个路口`)
