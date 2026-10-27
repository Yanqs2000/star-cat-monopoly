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
const outputPath = option('--output', resolve(root, 'src/modern/data/world-rules.json'))
const swf = readFileSync(resolve(root, 'public/original/play.swf'))
const sourceSha256 = createHash('sha256').update(swf).digest('hex')
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== sourceSha256) {
  throw new Error('原版 play.swf 校验失败')
}

const tables = JSON.parse(readFileSync(tablesPath, 'utf8'))
const sourceNpcs = tables.balkdate?.value
const sourcePlayers = tables.playerdate?.value
const sourceMoney = tables.moneydate?.value
if (!Array.isArray(sourceNpcs) || sourceNpcs.length !== 16 ||
    !Array.isArray(sourcePlayers) || sourcePlayers.length < 5 ||
    !Array.isArray(sourceMoney) || sourceMoney.length < 5) {
  throw new Error('原世界规则表缺失')
}

const npcDefinitions = sourceNpcs.map((row, id) => {
  if (!Array.isArray(row) || row.length < 2 || typeof row[0] !== 'string' || !Number.isInteger(row[1])) {
    throw new Error(`原NPC定义${id}无效`)
  }
  return { id, name: row[0], enabled: row[1] === 1 }
})
const initialNpcIds = npcDefinitions.filter(definition => definition.enabled).map(definition => definition.id)
const godIds = [2, 3, 4, 5, 10, 11]
if (JSON.stringify(initialNpcIds) !== JSON.stringify([1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15])) {
  throw new Error('原启用NPC顺序变化')
}
if (godIds.some(id => !initialNpcIds.includes(id))) throw new Error('六神定义缺失')

const aiLevels = sourcePlayers.slice(1, 5).map((row, index) => {
  const level = row?.[8]
  if (!Number.isInteger(level)) throw new Error(`原玩家槽位${index + 1} AI等级无效`)
  return level
})
const score = sourceMoney[1]?.[5]
const used = sourceMoney[1]?.[6]
const available = sourceMoney[1]?.[7]
const initialTickets = sourceMoney[1]?.[3]
if (![score, used, available, initialTickets].every(Number.isFinite)) throw new Error('原玩家资金元数据无效')

function location(name, days) {
  const tuple = tables[name]?.value
  if (!Array.isArray(tuple) || tuple.length !== 3 || tuple.some(value => !Number.isInteger(value))) {
    throw new Error(`${name}元数据无效`)
  }
  return { direction: tuple[0], position: { column: tuple[1], row: tuple[2] }, days }
}

const result = {
  sourceSha256,
  npcDefinitions,
  initialNpcIds,
  godIds,
  aiLevels,
  initialCredit: { score, used, available, grant: 100_000 },
  initialTickets,
  hospital: location('hospitaldate', 3),
  jail: location('jaildate', 5),
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(`已生成 ${initialNpcIds.length} 个初始NPC和 ${godIds.length} 位神明规则`)
