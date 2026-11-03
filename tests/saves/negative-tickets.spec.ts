import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { createSaveServer } from '../../server/app'
import { applyLuckEvent } from '../../src/modern/features/game/events'
import { createGame } from '../../src/modern/features/game/setup'
import { restoreControllerAfterVisual } from '../../src/modern/features/game/visual-recovery'
import { canSaveGame, createSnapshot } from '../../src/modern/features/saves/snapshot'
import type { SaveRecord } from '../../src/modern/features/saves/snapshot-types'

const dirs: string[] = []
const apps: FastifyInstance[] = []
const now = '2026-11-03T04:00:00.000Z'
const host = '127.0.0.1:4186'

afterEach(async () => {
  for (const app of apps.splice(0)) await app.close()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

it.each([1, 2, 3, 4])('玩家 %d 的合法负奖券可经过 API、SQLite 重启与控制器恢复而不丢失', async playerId => {
  const state = createGame([1], 102)
  const player = state.players[playerId - 1]!
  for (let i = 0; i < 3; i++) {
    const result = applyLuckEvent({ cash: player.cash, deposit: player.deposit, tickets: state.tickets[playerId]! }, 37, state.lostAndFoundFunds)
    state.tickets[playerId] = result.wallet.tickets
    state.lostAndFoundFunds = result.lostAndFoundFunds
  }
  expect(state.tickets[playerId]).toBe(-100)
  expect(canSaveGame(state)).toBe(true)
  const rng = state.rngState
  const snapshot = createSnapshot(state, [1], { speed: 1, paused: true }, now, now)
  const dir = mkdtempSync(join(tmpdir(), 'star-cat-negative-tickets-'))
  dirs.push(dir)
  const dbPath = join(dir, 'saves.sqlite')
  const app = await createSaveServer({ dbPath })
  apps.push(app)
  const session = await app.inject({ url: '/api/session', headers: { host } })
  const headers = { host, origin: `http://${host}`, cookie: session.headers['set-cookie']!.toString().split(';')[0]!, 'x-csrf-token': session.json().csrfToken as string }
  const saved = await app.inject({ method: 'PUT', url: '/api/saves/1', headers, payload: { expectedRevision: 0, requestId: 'negative-tickets-1', snapshot } })
  expect(saved.statusCode).toBe(200)
  await app.close()
  apps.splice(apps.indexOf(app), 1)

  const reopened = await createSaveServer({ dbPath })
  apps.push(reopened)
  const nextSession = await reopened.inject({ url: '/api/session', headers: { host } })
  const nextHeaders = { host, cookie: nextSession.headers['set-cookie']!.toString().split(';')[0]!, 'x-csrf-token': nextSession.json().csrfToken as string }
  const read = await reopened.inject({ url: '/api/saves/1', headers: nextHeaders })
  expect(read.statusCode).toBe(200)
  const record = read.json<SaveRecord>()
  expect(record.revision).toBe(1)
  expect(record.snapshot.state).toEqual(state)
  const controller = await restoreControllerAfterVisual(record.snapshot.state, {}, undefined, 1, true)
  try {
    expect(controller.state.tickets[playerId]).toBe(-100)
    expect(controller.state.rngState).toBe(rng)
    expect(controller.paused).toBe(true)
  } finally { controller.dispose() }
})

it.each([-0.5, -Infinity, Infinity, NaN, -Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER + 1])('拒绝非安全整数奖券 %s', tickets => {
  const state = createGame([1], 102)
  state.tickets[1] = tickets
  expect(() => createSnapshot(state, [1], { speed: 1, paused: true }, now, now)).toThrow()
})
