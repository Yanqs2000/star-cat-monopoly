export interface InteractionAsset {
  id: number
  sourceFrame: number
  url: string
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export interface InteractionAssetsManifest {
  version: 1
  sourceSha256: string
  cards: InteractionAsset[]
  luck: InteractionAsset[]
}

const CARD_IDS = new Set([1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33])
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('交互素材清单结构错误')
  }
  return value as Record<string, unknown>
}

function parseAsset(value: unknown, kind: '卡面' | '运气图'): InteractionAsset {
  const item = record(value)
  const path = kind === '卡面' ? 'cards' : 'luck'
  if (!Number.isInteger(item.id) || !Number.isInteger(item.sourceFrame) ||
      typeof item.url !== 'string' ||
      !new RegExp(`^assets/interactions/${path}/[1-9]\\d*\\.png$`).test(item.url) ||
      !Number.isInteger(item.width) || (item.width as number) <= 0 ||
      !Number.isInteger(item.height) || (item.height as number) <= 0 ||
      !finite(item.offsetX) || !finite(item.offsetY)) {
    throw new Error(`${kind}定义错误`)
  }
  return {
    id: item.id as number,
    sourceFrame: item.sourceFrame as number,
    url: item.url,
    width: item.width as number,
    height: item.height as number,
    offsetX: item.offsetX,
    offsetY: item.offsetY,
  }
}

export function parseInteractionAssets(value: unknown): InteractionAssetsManifest {
  const raw = record(value)
  if (raw.version !== 1) throw new Error('交互素材清单版本错误')
  if (typeof raw.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(raw.sourceSha256)) {
    throw new Error('来源哈希错误')
  }
  if (!Array.isArray(raw.cards) || raw.cards.length !== 17) {
    throw new Error('必须包含 17 张卡面')
  }
  if (!Array.isArray(raw.luck) || raw.luck.length !== 41) {
    throw new Error('必须包含 41 张运气图')
  }

  const cards = raw.cards.map(value => parseAsset(value, '卡面'))
  if (new Set(cards.map(({ id }) => id)).size !== cards.length) throw new Error('卡面 ID 重复')
  if (cards.some(({ id }) => !CARD_IDS.has(id))) throw new Error('卡面 ID 不在可达清单')
  if (cards.some(item => item.sourceFrame !== item.id + 1)) throw new Error('卡面源帧错误')
  if (cards.some(item => item.width !== 65 || item.height !== 67 ||
      item.offsetX !== -25 || item.offsetY !== -32)) {
    throw new Error('卡面原生几何错误')
  }
  if (cards.some(item => item.url !== `assets/interactions/cards/${item.id}.png`)) {
    throw new Error('卡面路径与 ID 不一致')
  }

  const luck = raw.luck.map(value => parseAsset(value, '运气图'))
  if (new Set(luck.map(({ id }) => id)).size !== luck.length) throw new Error('运气图 ID 重复')
  if (luck.some(({ id }) => id < 1 || id > 41)) throw new Error('运气图 ID 必须为 1 至 41')
  if (luck.some(item => item.sourceFrame !== item.id)) throw new Error('运气图源帧错误')
  if (luck.some(item => item.width !== 400 || item.height !== 300 ||
      item.offsetX !== 0 || item.offsetY !== 0)) {
    throw new Error('运气图原生几何错误')
  }
  if (luck.some(item => item.url !== `assets/interactions/luck/${item.id}.png`)) {
    throw new Error('运气图路径与 ID 不一致')
  }

  return { version: 1, sourceSha256: raw.sourceSha256, cards, luck }
}
