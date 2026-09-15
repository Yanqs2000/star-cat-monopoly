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
const outputPath = option('--output', resolve(root, 'src/modern/data/cards.json'))
const source = readFileSync(resolve(root, 'public/original/play.swf'))
const sourceSha256 = createHash('sha256').update(source).digest('hex')
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== sourceSha256) {
  throw new Error('原版 play.swf 校验失败')
}

const tables = JSON.parse(readFileSync(tablesPath, 'utf8'))
const sourceDefinitions = tables.carddate?.value
if (!Array.isArray(sourceDefinitions) || sourceDefinitions.length !== 37) {
  throw new Error('原卡表必须包含37条定义')
}

const definitions = sourceDefinitions.map((row, id) => {
  if (!Array.isArray(row) || row.length !== 5 || typeof row[0] !== 'string' ||
      !Number.isFinite(row[1]) || !Number.isInteger(row[2]) || !Number.isInteger(row[3]) ||
      typeof row[4] !== 'string') {
    throw new Error(`原卡定义 ${id} 格式错误`)
  }
  return {
    id,
    name: row[0],
    price: row[1],
    useType: row[2],
    handlerFrame: row[3],
    description: row[4],
  }
})

const ordinaryPool = definitions
  .filter(definition => definition.id >= 5 && definition.handlerFrame !== 0)
  .map(definition => definition.id)
if (ordinaryPool.length !== 16) throw new Error('原普通卡池必须包含16张卡')

const sourceInventories = tables.pcarddate?.value
if (!Array.isArray(sourceInventories) || sourceInventories.length < 4) throw new Error('原开局手牌表缺失')

function decodeInventory(row, playerIndex) {
  if (!Array.isArray(row) || row.length !== 25 || !Number.isInteger(row[0]) || row[0] < 0 || row[0] > 24) {
    throw new Error(`原玩家 ${playerIndex + 1} 手牌计数编码错误`)
  }
  const inventory = row.slice(1, row[0] + 1)
  if (inventory.some(id => !Number.isInteger(id) || id < 0 || id >= definitions.length)) {
    throw new Error(`原玩家 ${playerIndex + 1} 手牌包含无效卡ID`)
  }
  return inventory
}

const initialInventory = decodeInventory(sourceInventories[0], 0)
for (let index = 1; index < 4; index += 1) {
  if (JSON.stringify(decodeInventory(sourceInventories[index], index)) !== JSON.stringify(initialInventory)) {
    throw new Error('原四名开局玩家手牌不一致')
  }
}

const result = { sourceSha256, definitions, ordinaryPool, initialInventory }
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(`已生成 ${definitions.length} 条卡定义、${ordinaryPool.length} 张普通卡和 ${initialInventory.length} 张开局手牌`)
