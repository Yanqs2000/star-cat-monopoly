import anchors from '../../data/property-marker-anchors.json'
import type { AssetProfile } from '../assets/profiles'
import type { PropertyState } from '../game/property'
import type { ScenePoint } from './types'

const corners: Readonly<Record<string, readonly number[]>> = anchors.corners

/** Keep the cube's ground contact just inside the measured front corner cap. */
export function propertyMarkerOffset(parcelId: number, state: PropertyState, profile: AssetProfile): ScenePoint {
  if (profile !== 'hd' || state.ownerId === null || state.level !== 0) return { x: 0, y: 0 }
  const corner = corners[parcelId]
  if (!corner) return { x: 0, y: 0 }
  return {
    x: corner[0]! - anchors.sourceMarkerContact[0]!,
    y: corner[1]! - anchors.insetY - anchors.sourceMarkerContact[1]!,
  }
}
