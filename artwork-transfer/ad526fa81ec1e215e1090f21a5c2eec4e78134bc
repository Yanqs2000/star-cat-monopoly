import { cloneWorldSnapshot, type WorldSnapshot } from './world-cards'
import { randomInt } from './random'
import type { Direction } from './types'
import type { GridPoint } from '../map/types'
import { gridToScene } from '../map/coordinates'

export interface PortalHead { playerId: number; t: number; phase: 0|1|2|3; alpha: number }
export function createPortalHeads(source: WorldSnapshot): { heads: PortalHead[]; rngState: number } {
  let rngState=source.rngState
  const heads: PortalHead[]=[]
  for(const player of source.players) {
    if(source.world.statuses[player.id]!.state===9)continue
    const draw=randomInt(rngState,50);rngState=draw.nextState
    heads.push({playerId:player.id,t:draw.value,phase:0,alpha:100})
  }
  return {heads,rngState}
}
export function advancePortalHeads(source: PortalHead[], sourceRng: number): {heads: PortalHead[];rngState: number} {
  const heads=source.map(head=>({...head}));let rngState=sourceRng
  // Controlled AVM1 evidence: events run newest-created head first, regardless of swapped depths.
  for(const head of [...heads].reverse()) {
    head.t++
    if(head.phase===0) {
      const draw=randomInt(rngState,40);rngState=draw.nextState
      if(head.t>50+draw.value){head.phase=1;head.t=0}
    } else if(head.phase===1) {
      head.alpha=Math.max(0,head.alpha-5)
      if(head.t>20){head.alpha=0;head.phase=2;head.t=0}
    } else if(head.phase===2) {
      const draw=randomInt(rngState,10);rngState=draw.nextState
      if(head.t>5+draw.value){head.phase=3;head.t=0}
    } else {
      head.alpha=Math.min(100,head.alpha+5)
      if(head.t>20){head.alpha=100;head.phase=0;head.t=0}
    }
  }
  return {heads,rngState}
}

export interface PortalFlight {
  x: number; y: number; scale: number; stage: 0 | 1 | 2; stageFrames: number; frames: number
  to: { x: number; y: number }; stepX: number; stepY: number; heading: number; done: boolean; depth: number
}
export function createPortalFlight(from: GridPoint, to: GridPoint): PortalFlight {
  const start = gridToScene(from), end = gridToScene(to)
  const angle = -Math.atan2(start.x-end.x,start.y-end.y)
  const heading = Math.trunc((angle*180/Math.PI+260)/90)+1
  return { ...start, to: end, scale: 60, stage: 0, stageFrames: 0, frames: 0,
    stepX: 15*Math.sin(angle), stepY: -15*Math.cos(angle), heading: heading === 5 ? 1 : heading, done: false, depth: 10000003 }
}
export function advancePortalFlight(source: PortalFlight): PortalFlight {
  if (source.done) return source
  const flight = { ...source, frames: source.frames+1 }
  if (flight.stage === 0) {
    if (flight.stageFrames >= 40) { flight.scale=100;flight.stage=1;flight.stageFrames=0 }
    else { flight.stageFrames++;flight.scale++;flight.depth=10000003+20*flight.stageFrames }
  } else if (flight.stage === 2) {
    if (flight.stageFrames >= 41) return { ...flight, x: flight.to.x, y: flight.to.y, done: true }
    flight.stageFrames++;flight.scale--;flight.depth=10000803-20*flight.stageFrames
  }
  const distance = Math.hypot(flight.x-flight.to.x,flight.y-flight.to.y)
  if (distance <= 600 && flight.stage < 2) flight.stage=2
  // Native MovieClip writes truncate translations to signed integer twips.
  if (distance > 15) { flight.x=Math.trunc((flight.x+flight.stepX)*20)/20;flight.y=Math.trunc((flight.y+flight.stepY)*20)/20 }
  else { flight.x=flight.to.x;flight.y=flight.to.y }
  return flight
}

export const PORTALS = [
  { id: 1, name: '魔法门东站', position: { column: 31, row: 7 }, directions: [2,4] },
  { id: 2, name: '魔法门南站', position: { column: 32, row: 28 }, directions: [1,3] },
  { id: 3, name: '魔法门西站', position: { column: 9, row: 35 }, directions: [2,4] },
  { id: 4, name: '魔法门北站', position: { column: 8, row: 14 }, directions: [1,3] },
] as const
export interface PortalResult { snapshot: WorldSnapshot; destination: number; transferred: boolean; error: string | null }
export function portalAt(source: WorldSnapshot, playerId: number): number | null {
  const position = source.players.find(player => player.id === playerId)?.position
  return PORTALS.find(portal => portal.position.column === position?.column && portal.position.row === position.row)?.id ?? null
}
export function choosePortal(source: WorldSnapshot, playerId: number, destination: number): PortalResult {
  const origin = portalAt(source, playerId)
  if (origin === null || !Number.isInteger(destination) || destination < 1 || destination > 5) {
    return { snapshot: source, destination, transferred: false, error: '魔法门目的地无效' }
  }
  if (destination === 5 || destination === origin) return { snapshot: source, destination: 5, transferred: false, error: null }
  const snapshot = cloneWorldSnapshot(source)
  const draw = randomInt(snapshot.rngState, 2)
  snapshot.rngState = draw.nextState
  const player = snapshot.players.find(value => value.id === playerId)!
  const portal = PORTALS[destination - 1]!
  player.position = { ...portal.position }
  player.direction = portal.directions[draw.value]! as Direction
  return { snapshot, destination, transferred: true, error: null }
}
export function chooseAiPortal(source: WorldSnapshot, playerId: number): PortalResult {
  const draw = randomInt(source.rngState,5)
  return choosePortal({ ...source, rngState: draw.nextState }, playerId, draw.value+1)
}
