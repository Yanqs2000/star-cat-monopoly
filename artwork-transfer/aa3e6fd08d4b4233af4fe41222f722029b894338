export interface CompanyAsset {
  characterId: number
  sourceSpriteId: number
  url: string
  width: number
  height: number
  offsetX: number
  offsetY: number
  boundsTwips: [number, number, number, number]
}

export interface CompanyAssetsManifest {
  version: 1
  sourceSha256: string
  companies: CompanyAsset[]
  placements: Array<{ hometown: number; x: number; y: number; mainRecordId: number }>
}

const sourceIds = [186, 180, 213, 183, 189, 192, 204, 198, 195, 201, 207, 210]
const origins = [[1988, 251, 124], [1765, 1395, 127], [305, 1479, 130], [530, 330, 133]]
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('公司素材清单结构错误')
  return value as Record<string, unknown>
}

export function parseCompanyAssets(value: unknown): CompanyAssetsManifest {
  const raw = record(value)
  if (raw.version !== 1 || raw.sourceSha256 !== '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba' ||
      !Array.isArray(raw.companies) || raw.companies.length !== 12 ||
      !Array.isArray(raw.placements) || raw.placements.length !== 4) {
    throw new Error('公司素材来源或数量错误')
  }
  const companies = raw.companies.map((item, index) => {
    const asset = record(item)
    const bounds = asset.boundsTwips
    if (asset.characterId !== index + 1 || asset.sourceSpriteId !== sourceIds[index] ||
        asset.url !== `assets/companies/${index + 1}.png` ||
        !Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(finite) ||
        !finite(asset.width) || !finite(asset.height) || !finite(asset.offsetX) || !finite(asset.offsetY) ||
        asset.width !== (bounds[1] - bounds[0]) / 20 ||
        asset.height !== (bounds[3] - bounds[2]) / 20 ||
        asset.offsetX !== bounds[0] / 20 || asset.offsetY !== bounds[2] / 20) {
      throw new Error(`公司${index + 1}素材几何错误`)
    }
    return asset as unknown as CompanyAsset
  })
  const placements = raw.placements.map((item, index) => {
    const placement = record(item)
    const expected = origins[index]!
    if (placement.hometown !== index + 1 || placement.x !== expected[0] ||
        placement.y !== expected[1] || placement.mainRecordId !== expected[2]) {
      throw new Error(`出生区${index + 1}公司坐标错误`)
    }
    return placement as unknown as CompanyAssetsManifest['placements'][number]
  })
  return { version: 1, sourceSha256: raw.sourceSha256, companies, placements }
}

export function companyPlacement(manifest: CompanyAssetsManifest, characterId: number, hometown: number) {
  const asset = manifest.companies.find(item => item.characterId === characterId)
  const origin = manifest.placements.find(item => item.hometown === hometown)
  if (!asset || !origin) throw new Error('公司角色或出生区不存在')
  return { ...origin, url: asset.url, offsetX: asset.offsetX, offsetY: asset.offsetY }
}
