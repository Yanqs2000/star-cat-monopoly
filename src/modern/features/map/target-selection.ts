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

export function pickMapPointerAction(
  start: ScenePoint, end: ScenePoint, worldPoint: ScenePoint, targeting: boolean, cameraMoved: boolean,
): { kind: 'target' | 'inspect'; position: GridPoint } | undefined {
  if (cameraMoved) return undefined
  const position = pickTargetAfterPointer(start, end, worldPoint)
  return position ? { kind: targeting ? 'target' : 'inspect', position } : undefined
}
