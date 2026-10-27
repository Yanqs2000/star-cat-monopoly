# Task 1 Report: 纯财产交易与租金计算

## Status

DONE

Implemented from baseline `7a2b059`. The new pure property module reads the 56 residential parcels directly from `src/modern/data/map.json`, computes source-backed purchase, upgrade, maximum-level, and street-rent offers, and returns cloned player and ledger results without mutating the snapshot. It does not change `GameState`, controller, or UI behavior.

## Exact exported interfaces

```ts
export interface PropertyState {
  ownerId: number | null
  level: 0 | 1 | 2 | 3 | 4 | 5
}

export type PropertyLedger = Record<number, PropertyState>

export interface EconomySnapshot {
  players: PlayerState[]
  properties: PropertyLedger
}

export interface PropertyOffer {
  kind: 'purchase' | 'upgrade' | 'rent' | 'max-level'
  parcelId: number
  amount: number
  ownerId: number | null
}

export interface PropertyEvent {
  kind: 'purchased' | 'upgraded' | 'rent-paid' | 'declined' | 'insufficient-cash' | 'max-level'
  playerId: number
  parcelId: number
  amount: number
  recipientId?: number
  level?: number
}

export function createPropertyLedger(): PropertyLedger
export function findParcelAt(point: GridPoint): Parcel | undefined
export function getPropertyOffer(snapshot: EconomySnapshot, playerId: number, parcelId: number): PropertyOffer
export function calculateStreetRent(properties: PropertyLedger, ownerId: number, streetId: number): number
export function applyPropertyOffer(
  snapshot: EconomySnapshot,
  playerId: number,
  parcelId: number,
  choice: 'accept' | 'decline',
): { players: PlayerState[]; properties: PropertyLedger; event: PropertyEvent; insolvent: boolean }
export function getPropertySummary(
  properties: PropertyLedger,
  playerId: number,
): { landCount: number; buildingCount: number }
```

## Implementation and behavior

- `createPropertyLedger` initializes the exact 56 map parcel IDs to `{ ownerId: null, level: 0 }`.
- `findParcelAt` matches only `roadCell`; parcel 1's real road position resolves, while its paired building cell and a spawn/special position do not.
- Purchase uses `basePrice` and cash only, and preserves a pre-existing unowned level. Parcel 1's map price is 1500, so cash 100000 becomes 98500 while deposit stays 100000.
- Upgrade costs `100 * (current level + 1)`, covering level 0 to 1 for 100 and level 4 to 5 for 500. Level 5 returns `max-level` with no charge.
- Rent uses the integer-tenths coefficients `[4, 8, 15, 30, 60, 100] / 10`. Real map parcels 1 and 3 are both 1500 on street 1; at levels 0 and 1 they total 1800. Parcel 9 is on street 2 and is excluded, as are other owners' parcels.
- Rent first drains cash, then deposit, and credits the landlord's deposit with the full amount. It cannot be declined. A payer may finish with a negative deposit; `insolvent` is true when their cash plus deposit is at most zero, while the player total remains conserved.
- Missing/unknown parcel IDs, missing or malformed ledger entries, unknown owners, duplicate/invalid players, invalid levels, and invalid street/owner inputs are rejected before creating a result. Invalid operations leave the input snapshot unchanged.
- Every successful or non-successful `applyPropertyOffer` result contains a new player array with new player/position objects and a new ledger with new property objects. No transaction history, AI policy, UI phase gate, controller integration, or net-worth calculation was added.

## TDD evidence

Focused RED, after adding the complete business specs and before creating the production module:

```text
$ npm test -- tests/modern/property.spec.ts
Test Files  1 failed (1)
Tests       no tests
Error: Cannot find module '../../src/modern/features/game/property'
Duration    130ms
```

Focused GREEN:

```text
$ npm test -- tests/modern/property.spec.ts
Test Files  1 passed (1)
Tests       14 passed (14)
Duration    126ms
```

Full unit suite, run once after focused GREEN:

```text
$ npm test
Test Files  14 passed (14)
Tests       111 passed (111)
Duration    11.89s
```

TypeScript validation, run once after focused GREEN:

```text
$ npm run typecheck
vue-tsc --noEmit
exit 0
```

## Scope notes

The module applies the current offer supplied by the current snapshot. Duplicate landing-command suppression belongs to the Task 3 controller phase gate and is intentionally absent here. Existing 2B behavior remains covered by the successful full unit suite and typecheck.
