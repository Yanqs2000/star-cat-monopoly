import { createGameController, type GameController, type GameControllerOptions } from './controller'
import type { GameState } from './types'

export async function replayBeforeHydration<T>(
  replay: (() => Promise<void>) | undefined,
  hydrate: () => T,
): Promise<T> {
  if (replay) await replay()
  return hydrate()
}

export function restoreControllerAfterVisual(
  initial: GameState,
  options: GameControllerOptions,
  replay?: () => Promise<void>,
): Promise<GameController> {
  return replayBeforeHydration(replay, () => createGameController(initial, options))
}
