export type PropertyFacing = 1 | 2 | 3 | 4
export type PropertyLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface PropertyAssetManifest {
  version: 1
  sourceSha256: string
  sellSigns: Array<{
    facing: PropertyFacing
    url: string
    offsetX: number
    offsetY: number
  }>
  houses: Array<{
    ownerId: PropertyFacing
    facing: PropertyFacing
    level: PropertyLevel
    url: string
    offsetX: number
    offsetY: number
  }>
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const facing = (value: unknown): value is PropertyFacing =>
  value === 1 || value === 2 || value === 3 || value === 4
const level = (value: unknown): value is PropertyLevel =>
  value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5
const assetPath = (value: unknown): value is string =>
  typeof value === 'string' && /^assets\/properties\/[\w/-]+\.png$/.test(value)

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('地块素材清单结构错误')
  }
  return value as Record<string, unknown>
}

export function parsePropertyAssets(value: unknown): PropertyAssetManifest {
  const raw = record(value)
  if (raw.version !== 1) throw new Error('地块素材清单版本错误')
  if (typeof raw.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(raw.sourceSha256)) {
    throw new Error('来源哈希错误')
  }
  if (!Array.isArray(raw.sellSigns) || raw.sellSigns.length !== 4) {
    throw new Error('必须包含 4 个地块牌方向')
  }
  if (!Array.isArray(raw.houses) || raw.houses.length !== 96) {
    throw new Error('必须包含 96 个房屋变体')
  }

  const sellSigns = raw.sellSigns.map((value) => {
    const item = record(value)
    if (!facing(item.facing) || !assetPath(item.url) ||
        !finite(item.offsetX) || !finite(item.offsetY)) {
      throw new Error('地块牌定义错误')
    }
    return {
      facing: item.facing,
      url: item.url,
      offsetX: item.offsetX,
      offsetY: item.offsetY,
    }
  })
  if (new Set(sellSigns.map(({ facing }) => facing)).size !== 4) {
    throw new Error('地块牌方向重复')
  }
  if (sellSigns.some(item => item.url !== `assets/properties/sell-sign/facing-${item.facing}.png`)) {
    throw new Error('地块牌路径与方向不一致')
  }

  const houses = raw.houses.map((value) => {
    const item = record(value)
    if (!facing(item.ownerId) || !facing(item.facing) || !level(item.level) ||
        !assetPath(item.url) || !finite(item.offsetX) || !finite(item.offsetY)) {
      throw new Error('房屋定义错误')
    }
    return {
      ownerId: item.ownerId,
      facing: item.facing,
      level: item.level,
      url: item.url,
      offsetX: item.offsetX,
      offsetY: item.offsetY,
    }
  })
  const houseKeys = houses.map(({ ownerId, facing, level }) => `${ownerId}:${facing}:${level}`)
  if (new Set(houseKeys).size !== 96) throw new Error('房屋变体重复')
  if (houses.some(item => item.url !== `assets/properties/houses/owner-${item.ownerId}/facing-${item.facing}/level-${item.level}.png`)) {
    throw new Error('房屋路径与变体不一致')
  }

  return { version: 1, sourceSha256: raw.sourceSha256, sellSigns, houses }
}
