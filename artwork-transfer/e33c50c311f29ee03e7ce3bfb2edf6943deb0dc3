import worldRules from '../../data/world-rules.json'
import { applyRestriction, cloneWorldSnapshot, type WorldSnapshot } from './world-cards'
import { randomInt } from './random'

export const COURT_CASES = [
  { id: 0, name: '行为不检', days: 2, low: 60, high: 80 },
  { id: 1, name: '欺善怕恶', days: 3, low: 50, high: 75 },
  { id: 2, name: '藐视电脑', days: 5, low: 40, high: 70 },
] as const
export type CourtVerdict = 'win' | 'settle' | 'lose'
export interface CourtResult {
  snapshot: WorldSnapshot; verdict: CourtVerdict | null; roll: number | null; jailedPlayerId: number | null; error: string | null
}
export function courtTargets(source: WorldSnapshot, playerId: number): number[] {
  if (!source.players.some(player => player.id === playerId)) return []
  return source.players.filter(player => player.id !== playerId && !(source.eliminatedPlayerIds ?? []).includes(player.id) && ![2,3].includes(source.world.statuses[player.id]!.state)).map(player => player.id)
}
export function judgeCourt(source: WorldSnapshot, plaintiffId: number, defendantId: number, caseId: number): CourtResult {
  if (!courtTargets(source, plaintiffId).includes(defendantId) || !Number.isInteger(caseId) || !COURT_CASES[caseId]) {
    return { snapshot: source, verdict: null, roll: null, jailedPlayerId: null, error: '法院目标或案件无效' }
  }
  const snapshot = cloneWorldSnapshot(source)
  const draw = randomInt(snapshot.rngState,101)
  snapshot.rngState = draw.nextState
  const chosen = COURT_CASES[caseId]!
  const verdict = draw.value < chosen.low ? 'win' : draw.value <= chosen.high ? 'settle' : 'lose'
  const jailedPlayerId = verdict === 'win' ? defendantId : verdict === 'lose' ? plaintiffId : null
  if (jailedPlayerId !== null) applyRestriction(snapshot, jailedPlayerId,
    { ...worldRules.jail, days: chosen.days + (jailedPlayerId <= plaintiffId ? 1 : 0) },2)
  return { snapshot, verdict, roll: draw.value, jailedPlayerId, error: null }
}
