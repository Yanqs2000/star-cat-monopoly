import { randomInt } from './random'

/** frame4 mood_pg: random depth, then random phrase. Only the RNG state is retained.
 * All frame3 talkdate pools are nonempty; LCG nextState is independent of the bound.
 * A unit bound discards the unused phrase choice without changing subsequent draws.
 */
export function advanceSourceMoodRandom(rngState: number): number {
  return randomInt(randomInt(rngState, 1000).nextState, 1).nextState
}
