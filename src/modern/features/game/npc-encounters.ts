import { drawCard } from './card-economy'
import { randomInt } from './random'
import { advanceSourceMoodRandom } from './source-mood'
import type { ActivityReceipt } from './activity-types'
import type { WorldSnapshot } from './world-cards'

/** Applied only to a private working snapshot owned by resolveWorldCell. */
export function applyOrdinaryNpcEffect(snapshot: WorldSnapshot, playerId: number, npcId: number): ActivityReceipt {
  const player = snapshot.players.find(value => value.id === playerId)!
  const beforeCash = player.cash
  const beforeDeposit = player.deposit
  const beforeTickets = snapshot.tickets[playerId]!
  const receipt: ActivityReceipt = { kind: `npc-${npcId}` }
  const addLostFunds = (amount: number) => {
    snapshot.lostAndFoundFunds[0] += amount
    snapshot.lostAndFoundFunds[1] += amount
    receipt.lostAndFoundDeltas = [amount, amount]
  }
  if (npcId === 12) {
    receipt.sourceAmount = 1000
    player.cash -= 1000
    if (player.cash < 0) { player.deposit += player.cash; player.cash = 0 }
    addLostFunds(1000)
  } else if (npcId === 13) {
    if (beforeTickets > 30) {
      const amount = Math.trunc(beforeTickets * 0.2)
      receipt.sourceAmount = amount
      snapshot.tickets[playerId] = beforeTickets - amount
      addLostFunds(amount * 100)
    } else {
      receipt.sourceAmount = 100
      snapshot.tickets[playerId] = beforeTickets + 100
    }
  } else if (npcId === 14) {
    const inventory = snapshot.inventories[playerId]!
    if (inventory.length > 3) {
      receipt.removedCardIds = []
      for (let index = 0; index < 2; index += 1) {
        const draw = randomInt(snapshot.rngState, inventory.length)
        snapshot.rngState = draw.nextState
        receipt.removedCardIds.push(inventory.splice(draw.value, 1)[0]!)
      }
      addLostFunds(5000)
    } else {
      receipt.addedCardIds = []
      for (let index = 0; index < 2; index += 1) {
        const draw = drawCard(snapshot.inventories[playerId]!, snapshot.rngState)
        snapshot.rngState = draw.rngState
        snapshot.inventories[playerId] = draw.inventory
        receipt.addedCardIds.push(draw.cardId)
      }
    }
  } else if (npcId === 15) {
    if (beforeCash > 3000) {
      const draw = randomInt(snapshot.rngState, 6)
      snapshot.rngState = draw.nextState
      receipt.rate = draw.value + 5
      const amount = Math.trunc(beforeCash * receipt.rate / 100)
      receipt.sourceAmount = amount
      player.cash -= amount
      addLostFunds(amount)
    } else {
      receipt.sourceAmount = 20000
      player.cash += 20000
    }
  }
  // Original mood follows the card/percentage draw and precedes setnpc.
  snapshot.rngState = advanceSourceMoodRandom(snapshot.rngState)
  receipt.cashDelta = player.cash - beforeCash
  receipt.depositDelta = player.deposit - beforeDeposit
  receipt.ticketDelta = snapshot.tickets[playerId]! - beforeTickets
  return receipt
}
