import { pickCardCell } from '../game/direct-cards'
import type { GridPoint, ScenePoint } from './types'

const CLICK_THRESHOLD_PX = 6

export function pickTargetAfterPointer(
  start: ScenePoint,
  end: ScenePoint,
  worldPoint: ScenePoint,
): GridPoint | undefined {
  if (Math.hypot(end.x - start.x, end.y - start.y) > CLICK_THRESHOLD_PX) return undefined
  return pickCardCell(worldPoint)?.position
}
