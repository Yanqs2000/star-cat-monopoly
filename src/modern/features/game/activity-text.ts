import { getCardDefinition } from './card-economy'
import type { ActivityReceipt } from './activity-types'

export function activityChanges(receipt: ActivityReceipt): string {
  const money = [['现金', receipt.cashDelta], ['存款', receipt.depositDelta], ['奖券', receipt.ticketDelta]]
    .filter((value): value is [string, number] => typeof value[1] === 'number' && value[1] !== 0)
    .map(([label, amount]) => `${label} ${amount > 0 ? '+' : ''}${amount}`)
  if(receipt.kind==='ludo'&&receipt.ticketDebit!==undefined&&receipt.ticketCredit!==undefined) {
    money.unshift(`入场 -${receipt.ticketDebit} 券`,`返还 +${receipt.ticketCredit} 券`)
    if(receipt.ticketDelta===0)money.push('奖券 +0')
  }
  if (receipt.addedCardIds?.length) money.push(`获得 ${receipt.addedCardIds.map(id => getCardDefinition(id).name).join('、')}`)
  if (receipt.removedCardIds?.length) money.push(`失去 ${receipt.removedCardIds.map(id => getCardDefinition(id).name).join('、')}`)
  return money.join(' · ') || '账户无变化'
}

export function originalActivityText(receipt?: ActivityReceipt): Record<string, string> {
  if (!receipt) return {}
  const titles: Record<string, string> = { 'npc-9': '路遇恶犬', 'npc-12': '路遇交警', 'npc-13': '路遇流氓', 'npc-14': '路遇小偷', 'npc-15': '路遇乞丐', 'lost-found': '失物招领~' }
  const explanations: Record<string, string> = {
    'npc-9': '与恶犬大战三百回合，落败入院', 'npc-12': '因超速驾驶和闯红灯被罚1000元',
    'npc-13': receipt.ticketDelta! < 0 ? '被流氓勒索了身上20％的奖券！' : '流氓威逼你收下他送的100奖券',
    'npc-14': '你仔细搜索钱包，检查损失',
    'npc-15': receipt.cashDelta! < 0 ? `被乞丐强行索取了${receipt.rate}％的现金` : '你太穷酸了，乞丐施舍你2万元',
    'lost-found': `领取到丢失财物共计：${receipt.sourceAmount} 元`,
  }
  const cards = receipt.removedCardIds ?? receipt.addedCardIds ?? []
  return {
    trait_say1: titles[receipt.kind] ?? '', trait_say2: explanations[receipt.kind] ?? '',
    show_say1: receipt.removedCardIds ? '霉运当头' : '意外！你的运气不太坏',
    show_say2: receipt.removedCardIds ? '遇到小偷，遗失卡片' : '小偷失手，反被你索得卡片',
    show_say3: cards[0] ? getCardDefinition(cards[0]).name : '', show_say4: cards[1] ? getCardDefinition(cards[1]).name : '',
  }
}
