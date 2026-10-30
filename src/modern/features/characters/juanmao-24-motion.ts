import type { Facing } from './assets'
export type Juanmao24Action = 'walk' | 'neutral' | 'ready' | 'happy' | 'sad' | 'hurt' | 'cheer'
export interface Juanmao24Point { x: number; y: number }
export interface Juanmao24Pose {
  leftFoot: Juanmao24Point & { lift: number }
  rightFoot: Juanmao24Point & { lift: number }
  leftHand: Juanmao24Point
  rightHand: Juanmao24Point
  bodyY: number
  bodyRotation: number
  headRotation: number
  expression: 'neutral' | 'happy' | 'sad' | 'hurt'
  soot: number
  tears: number
  readyProp: boolean
}
const TAU = Math.PI * 2
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value))
const smooth = (value: number): number => { const x = clamp(value, 0, 1); return x * x * (3 - 2 * x) }
export function juanmao24DurationMs(action: Juanmao24Action, facing: Facing): number {
  if (action === 'walk') return 800
  if (action === 'happy') return 1900
  if (action === 'sad') return (facing === 'down-left' ? 74 : 73) * 1000 / 30
  if (action === 'hurt') return 2000
  if (action === 'cheer') return 68 * 1000 / 30
  return 1000 / 30
}

/** Continuous new 2D puppet motion; source walk cadence is 8 poses held 100 ms each. */
export function sampleJuanmao24(action: Juanmao24Action, facing: Facing, elapsedMs: number): Juanmao24Pose {
  const duration = juanmao24DurationMs(action, facing)
  const time = action === 'walk' ? Math.max(0, elapsedMs) % duration : clamp(elapsedMs, 0, duration)
  const t = time / 1000
  const pose: Juanmao24Pose = {
    leftFoot: { x: 0, y: 0, lift: 0 }, rightFoot: { x: 0, y: 0, lift: 0 },
    leftHand: { x: 0, y: 0 }, rightHand: { x: 0, y: 0 },
    bodyY: 0, bodyRotation: 0, headRotation: 0, expression: 'neutral', soot: 0, tears: 0, readyProp: action === 'ready',
  }
  if (action === 'neutral' || action === 'ready') {
    if (action === 'ready') { pose.rightHand = { x: -3, y: -4 }; pose.leftHand = { x: 2, y: -2 } }
    return pose
  }
  if (action === 'walk') {
    const phase = time / 800
    const forward = facing.includes('right') ? 1 : -1
    const vertical = facing.startsWith('down') ? 0.45 : -0.45
    const foot = (p: number): Juanmao24Pose['leftFoot'] => {
      p %= 1
      // Support is linear along the floor; swing returns with eased horizontal velocity.
      const swing = (p - 0.5) * 2
      const travel = p <= 0.5 ? 1 - 4 * p : -1 - 2 * swing + 12 * swing * swing - 8 * swing * swing * swing
      const lift = p <= 0.5 ? 0 : Math.pow(Math.sin(swing * Math.PI), 2) * 4.4
      return { x: travel * 5.5 * forward, y: travel * 5.5 * vertical - lift, lift }
    }
    pose.leftFoot = foot(phase)
    pose.rightFoot = foot((phase + 0.5) % 1)
    const swing = Math.sin(phase * TAU) * 3
    pose.leftHand = { x: -swing * forward, y: -swing * vertical }
    pose.rightHand = { x: swing * forward, y: swing * vertical }
    pose.bodyY = -Math.pow(Math.sin(phase * TAU), 2) * 0.65
    pose.bodyRotation = Math.sin(phase * TAU) * 0.015
    pose.headRotation = -Math.sin(phase * TAU) * 0.012
    return pose
  }
  const enter = smooth(t / 0.28)
  const exit = smooth((duration / 1000 - t) / 0.3)
  const envelope = enter * exit
  if (action === 'happy') {
    pose.expression = t > 0.28 ? 'happy' : 'neutral'
    pose.bodyY = -Math.pow(Math.sin(t * Math.PI * 3.2), 2) * 1.4 * envelope
    pose.leftHand = { x: 1.4 * envelope, y: -3.4 * envelope }
    pose.rightHand = { x: -1.4 * envelope, y: -3.4 * envelope }
    pose.headRotation = Math.sin(t * Math.PI * 4) * 0.025 * envelope
  } else if (action === 'sad') {
    pose.expression = t > 0.25 ? 'sad' : 'neutral'
    pose.bodyY = 1.2 * enter
    pose.bodyRotation = -0.035 * enter
    pose.headRotation = 0.045 * enter + Math.sin(t * 16) * 0.007 * envelope
    pose.leftHand = { x: 2.5 * enter, y: -5.8 * enter }
    pose.rightHand = { x: -2.5 * enter, y: -5.8 * enter }
    pose.tears = smooth((t - 0.5) / 0.3)
  } else if (action === 'hurt') {
    pose.expression = 'hurt'
    pose.soot = smooth((t - 0.34) / 0.18)
    pose.bodyY = -Math.sin(clamp(t / 0.4, 0, 1) * Math.PI) * 5 + (t > 0.6 ? Math.sin(t * 28) * 0.25 * envelope : 0)
    pose.bodyRotation = Math.sin(t * 19) * 0.06 * envelope
    pose.headRotation = -pose.bodyRotation * 0.7
    pose.leftHand = { x: -3 * envelope, y: -1.8 * envelope }
    pose.rightHand = { x: 3 * envelope, y: -1.8 * envelope }
  } else {
    pose.expression = t > (action === 'cheer' ? 0.4 : 0.28) ? 'happy' : 'neutral'
    // Anticipation, jump, suspended cheer, landing and settle follow source phases.
    const jump = smooth((t - 0.25) / 0.28) * (1 - smooth((t - 1.45) / 0.5))
    const crouch = Math.sin(clamp(t / 0.28, 0, 1) * Math.PI) * 2
    pose.bodyY = crouch - jump * 6
    pose.leftFoot.y = -jump * 6
    pose.rightFoot.y = -jump * 6
    pose.leftFoot.lift = jump * 6
    pose.rightFoot.lift = jump * 6
    pose.leftHand = { x: -5 * jump, y: -11 * jump }
    pose.rightHand = { x: 5 * jump, y: -11 * jump }
    pose.headRotation = Math.sin(t * 7) * 0.03 * envelope
  }
  return pose
}

/** Two-bone IK keeps the texture geometry and chooses a stable anatomical bend side. */
export function juanmao24Joint(a: Juanmao24Point, b: Juanmao24Point, upper: number, lower: number, bend: number): Juanmao24Point {
  const dx = b.x - a.x, dy = b.y - a.y
  const distance = Math.max(0.0001, Math.hypot(dx, dy))
  const reach = Math.min(distance, upper + lower - 0.0001)
  const along = (upper * upper - lower * lower + reach * reach) / (2 * reach)
  const side = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend
  return { x: a.x + (dx * along - dy * side) / distance, y: a.y + (dy * along + dx * side) / distance }
}

/** Straight world displacement, in map scene pixels. Standalone time-based sampling remains available. */
export function sampleJuanmao24Grounded(distancePx: number, facing: Facing, direction: Juanmao24Point): Juanmao24Pose {
  const cycleDistance = 24
  const distance = Math.max(0,distancePx), phase = (distance % cycleDistance) / cycleDistance
  const length = Math.hypot(direction.x,direction.y) || 1
  const unit = {x:direction.x/length,y:direction.y/length}
  const pose = sampleJuanmao24('walk',facing,phase*800)
  const foot = (p: number): Juanmao24Pose['leftFoot'] => {
    p %= 1
    const u=(p-0.5)*2
    const travel = p<=0.5 ? 1-4*p : -1-2*u+12*u*u-8*u*u*u
    const lift = p<=0.5 ? 0 : Math.pow(Math.sin(u*Math.PI),2)*3.2
    return {x:travel*cycleDistance/4*unit.x,y:travel*cycleDistance/4*unit.y-lift,lift}
  }
  pose.leftFoot=foot(phase);pose.rightFoot=foot((phase+0.5)%1)
  // Tiny legs need a brisk cadence at the original map speed; keep the large head calm.
  pose.bodyY*=0.45;pose.bodyRotation*=0.6;pose.headRotation*=0.45
  pose.leftHand.x*=0.7;pose.leftHand.y*=0.7;pose.rightHand.x*=0.7;pose.rightHand.y*=0.7
  return pose
}
