import type { GridPoint, ScenePoint } from './types'

export function gridToScene(point: GridPoint): ScenePoint {
  return { x: point.column * 56, y: point.row * 40 }
}
export function sceneToGrid(point: ScenePoint): GridPoint {
  return { column: point.x / 56, row: point.y / 40 }
}
