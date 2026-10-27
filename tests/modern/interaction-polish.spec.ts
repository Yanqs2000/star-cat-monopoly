// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

const source = () => { const game=createGame([7,1,3,4],42);Object.assign(game.players[0]!,{cash:9500,deposit:42000});game.finance.loans[1]=12000;return game }
it('银行图文钱包与业务预览绑定真实账户，办理操作仍只发出原事件', async()=>{
 const game=source();game.interaction={kind:'bank',playerId:1,resume:'after-bank'}
 const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[]}})
 expect(panel.get('[data-testid="player-wallet"]').text()).toContain('现金 9500')
 expect(panel.get('[data-testid="player-wallet"] img[alt="帅戈"]').attributes('src')).toContain('/7.png')
 expect(panel.get('[data-testid="player-wallet"]').text()).toContain('贷款 12000')
 const before=JSON.stringify(game)
 await panel.get('[data-testid="bank-operation"]').setValue('deposit');await panel.get('[data-testid="bank-amount"]').setValue('250')
 expect(panel.get('[data-testid="bank-preview"]').text()).toContain('现金 -250')
 expect(panel.get('[data-testid="bank-preview"]').text()).toContain('存款 +250')
 await panel.get('[data-testid="bank-form"]').trigger('submit')
 expect(panel.emitted('bank-operation')).toEqual([['deposit',250]])
 expect(JSON.stringify(game)).toBe(before)
})
it('股票报价突出真实现价涨跌、已持股和交易现金预览', async()=>{
 const game=source();game.interaction={kind:'stock',playerId:1,resume:'after-stock'};Object.assign(game.finance.stocks[1]!,{price:22.5,change:2.5,dailyBuyLimit:500});game.finance.stocks[1]!.holdings[1]={shares:7,averageCost:18}
 const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[]}})
 expect(panel.get('[data-testid="stock-quote"]').text()).toContain('22.5')
 expect(panel.get('[data-testid="stock-quote"]').text()).toContain('+2.5')
 expect(panel.get('[data-testid="stock-quote"]').text()).toContain('已持 7')
 await panel.get('[data-testid="stock-shares"]').setValue(3)
 expect(panel.get('[data-testid="stock-preview"]').text()).toContain('67.50')
 await panel.get('[data-testid="stock-buy"]').trigger('click')
 expect(panel.emitted('trade-stock')).toEqual([['buy',1,3]])
})
it('控骰点数使用已准备的骰面图片，选点仍发送真实值', async()=>{
 const game=source();game.interaction={kind:'dice-choice',playerId:1,cardId:5,cardIndex:0,resume:'await-roll',choiceError:null}
 const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[],preparedImages:{'assets/activities/ludo-face-6/1.png':'blob:face6'}}})
 expect(panel.findAll('.dice img')).toHaveLength(6)
 expect(panel.get('[data-testid="dice-6"] img').attributes('src')).toBe('blob:face6')
 await panel.get('[data-testid="dice-6"]').trigger('click')
 expect(panel.emitted('choose')).toEqual([[{kind:'dice',value:6}]])
})
it('金融结算分别显示真实资金变化，关闭仍由玩家明确确认', async()=>{
 const game=source();game.interaction={kind:'notice',playerId:1,resume:'bank',notice:{kind:'bank',message:'bank-deposit',financeEntry:{kind:'bank-deposit',playerId:1,cashDelta:-250,depositDelta:250}}}
 const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[]}})
 expect(panel.findAll('.finance-change').map(cell=>cell.text())).toEqual(['现金 -250','存款 +250'])
 expect(panel.find('[data-testid="player-wallet"]').exists()).toBe(true)
 expect(panel.emitted('acknowledge')).toBeUndefined()
 await panel.get('[data-testid="interaction-acknowledge"]').trigger('click')
 expect(panel.emitted('acknowledge')).toEqual([[]])
})
it('授信结果用信用卡图片表达额度变化，不用现金图造成到账歧义',()=>{
 const game=source();game.interaction={kind:'notice',playerId:1,resume:'bank',notice:{kind:'bank',message:'credit-granted',financeEntry:{kind:'credit-granted',playerId:1,creditAvailableDelta:100000}}}
 const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[],preparedImages:{'assets/interactions/cards/1.png':'blob:credit-card'}}})
 expect(panel.get('[data-testid="notice-art"]').attributes('src')).toBe('blob:credit-card')
 expect(panel.get('[data-testid="notice-art"]').attributes('alt')).toBe('信用卡')
 expect(panel.get('.finance-change').text()).toBe('可用信用 +100000')
})
