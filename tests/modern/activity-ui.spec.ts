// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

it.each(['sell', 'buy'] as const)('原兑换场景%s提交数量并保留真实余额，暂停禁止操作', async mode => {
  const game = createGame([1], 1)
  game.phase = 'interaction'
  game.interaction = { kind: 'ticket-exchange', playerId: 1, mode }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  expect(panel.find('[data-testid="exchange-original"]').exists()).toBe(true)
  expect(panel.get('[data-testid="exchange-original"]').attributes('src')).toContain(mode === 'sell' ? '/witch/' : '/lottery/')
  await panel.get('[data-testid="exchange-quantity"]').setValue('10')
  await panel.get('[data-testid="exchange-form"]').trigger('submit')
  expect(panel.emitted('exchange-tickets')).toEqual([[10]])
  expect(panel.text()).toContain('单次最多 100 张')
  await panel.setProps({ paused: true })
  expect((panel.get('[data-testid="exchange-submit"]').element as HTMLButtonElement).disabled).toBe(true)
  panel.unmount()
})

it('NPC收据区分实际现金和存款扣款，失物招领镜像不呈现为第二次收入', () => {
  const game = createGame([1], 1)
  game.phase = 'interaction'
  game.interaction = { kind: 'notice', playerId: 1, resume: 'after-god', notice: {
    kind: 'world', message: 'npc-encountered', npcId: 12, eventKind: 'npc-encountered',
    amount: 1000, receipt: { kind: 'npc-12', sourceAmount: 1000, cashDelta: -300, depositDelta: -700, lostAndFoundDeltas: [1000,1000] },
  } }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  expect(panel.text()).toContain('警察')
  expect(panel.text()).toContain('现金 -300')
  expect(panel.text()).toContain('存款 -700')
  expect(panel.text()).not.toContain('数值 +1000')
  panel.unmount()
})

it('投注净变化为零仍明确记录入场消耗与实际返还，不能只显示账户无变化',()=>{
 const game=createGame([1],1);game.phase='interaction';game.interaction={kind:'notice',playerId:1,resume:'end-turn',notice:{kind:'activity',message:'ludo-result',receipt:{kind:'ludo',sourceAmount:100,ticketDelta:0,ticketDebit:100,ticketCredit:100}}}
 const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[]}})
 expect(panel.text()).toContain('入场 -100 券');expect(panel.text()).toContain('返还 +100 券');expect(panel.text()).toContain('奖券 +0');panel.unmount()
})
