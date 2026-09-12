export interface GridPoint { column: number; row: number }
export interface ScenePoint { x: number; y: number }
export interface Parcel {
  id: number
  roadCell: GridPoint
  buildingCell: GridPoint
  streetId: number
  streetName: string
  basePrice: number
  facing: 1 | 2 | 3 | 4
}
export interface MapData {
  rows: number
  columns: number
  grid: number[][]
  parcels: Parcel[]
  sourceSha256: string
}
