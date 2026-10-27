// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createGame } from '../../src/modern/features/game/setup'
import { settleBankruptcy } from '../../src/modern/features/game/lifecycle'
import EndgamePanel from '../../src/modern/features/game/EndgamePanel.vue'
import GamePanel from '../../src/modern/features/game/GamePanel.vue'

it('破产原图和清算收据可见，暂停不允许确认',async()=>{
 let game=createGame([1,2,3,4],1);game.players[0]!.cash=0;game.players[0]!.deposit=-300;game=settleBankruptcy(game,1)
 game.phase='interaction';game.interaction={kind:'bankruptcy',playerId:1,receipt:game.bankruptcyReceipts[0]!}
 const panel=mount(EndgamePanel,{props:{game,paused:true}})
 expect(panel.text()).toContain('卷毛破产');expect(panel.text()).toContain('存款 -300 → 0')
 expect(panel.get('img').attributes('src')).toContain('/bankrupt/1.png')
 expect(panel.get('[data-testid="bankruptcy-acknowledge"]').attributes()).toHaveProperty('disabled')
 await panel.setProps({paused:false});await panel.get('[data-testid="bankruptcy-acknowledge"]').trigger('click')
 expect(panel.emitted('acknowledge')).toHaveLength(1)
})
it('终局保留结果与座位状态，可重新开局或返回选人',async()=>{
 const game=createGame([12,2,3,4],1);game.phase='ended';game.outcome={kind:'victory',winnerId:1};game.eliminatedPlayerIds=[2,3,4]
 const panel=mount(EndgamePanel,{props:{game,paused:false}})
 expect(panel.text()).toContain('妮妮胜出');expect(panel.get('img').attributes('src')).toContain('/gamewin/1.png')
 await panel.get('[data-testid="endgame-restart"]').trigger('click');expect(panel.emitted('restart')).toHaveLength(1)
 await panel.get('[data-testid="endgame-selection"]').trigger('click');expect(panel.emitted('selection')).toHaveLength(1)
})
it('托管按钮提交控制请求，淘汰者不显示可接管入口',async()=>{
 const game=createGame([1],1);game.eliminatedPlayerIds=[4]
 const panel=mount(GamePanel,{props:{game,paused:false,speed:1,history:[]}})
 await panel.get('[data-testid="control-1"]').trigger('click');expect(panel.emitted('control')).toEqual([[1,'autoplay']])
 await panel.get('[data-testid="control-all"]').trigger('click');expect(panel.emitted('control')).toHaveLength(4)
 expect(panel.find('[data-testid="control-4"]').exists()).toBe(false)
 await panel.setProps({game:{...game,players:game.players.map(p=>p.id===1?{...p,controller:'autoplay' as const}:p)}})
 expect(panel.get('[data-testid="current-player"]').text()).toContain('托管')
 expect(panel.get('[data-testid="player-list"]').text()).toContain('托管')
})
