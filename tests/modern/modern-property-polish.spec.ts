// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import EndgamePanel from '../../src/modern/features/game/EndgamePanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

it('升级展示真实产权、朝向和当前与下一等级，不把升级预览当作已成交', async () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.phase = 'property-decision'
  game.propertyOffer = { kind: 'upgrade', parcelId: 47, amount: 2000, ownerId: 2 }
  game.properties[47] = { ownerId: 2, level: 2 }
  const panel = mount(PropertyPanel, { props: { game, paused: false } })
  expect(panel.get('[data-testid="property-current-art"]').attributes('src')).toContain('/owner-2/facing-2/level-2.png')
  expect(panel.get('[data-testid="property-next-art"]').attributes('src')).toContain('/owner-2/facing-2/level-3.png')
  expect(panel.text()).toContain('升级后预览')
  expect(panel.emitted('decide')).toBeUndefined()
  await panel.get('[data-testid="property-accept"]').trigger('click')
  expect(panel.emitted('decide')).toEqual([['accept']])
})

it('收费房屋图片仅来自同街真实地主，HD按已登记映射且图片错误可恢复', async () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.phase = 'property-decision'
  game.propertyOffer = { kind: 'rent', parcelId: 47, amount: 3800, ownerId: 2 }
  game.properties[43] = { ownerId: 2, level: 2 }
  game.properties[47] = { ownerId: 2, level: 0 }
  game.properties[45] = { ownerId: 3, level: 5 }
  const panel = mount(PropertyPanel, { props: { game, paused: false, assetProfile: 'hd' } })
  const houses = panel.findAll('[data-testid="rent-house-art"]')
  expect(houses).toHaveLength(2)
  expect(houses[0]!.attributes('src')).toContain('/hd-static/properties/houses/owner-2/facing-2/level-2.webp')
  expect(houses[1]!.attributes('src')).toContain('/hd-static/properties/houses/owner-2/facing-1/level-0.webp')
  expect(panel.find('button').exists()).toBe(false)
  await houses[0]!.trigger('error')
  expect(panel.emitted('asset-error')?.[0]?.[0]).toBeInstanceOf(Error)
})

it('胜出者角色图与每位玩家的图文资金账目一致，新增角色图不假定HD路径', () => {
  const game = createGame([12, 2, 3, 4], 1)
  game.phase = 'ended'; game.outcome = { kind: 'victory', winnerId: 1 }
  game.eliminatedPlayerIds = [2, 3, 4]
  game.players[0]!.cash = 12345
  const panel = mount(EndgamePanel, { props: { game, paused: false, assetProfile: 'hd' } })
  expect(panel.get('[data-testid="endgame-actor-art"]').attributes('src')).toContain('/assets/monthly/champions/12.png')
  const winner = panel.get('[data-testid="endgame-player-1"]')
  expect(winner.text()).toContain('妮妮')
  expect(winner.text()).toContain('现金 12345')
  expect(winner.text()).toContain('胜出')
  expect(panel.findAll('[data-testid^="endgame-player-"]')).toHaveLength(4)
  expect(winner.findAll('img').map(image => image.attributes('src'))).toContain('/hd-static/approved-01-12/ui/cash.webp')
})

it('高清地产面板使用已验收现金图，不请求不存在的HD钱包图', () => {
  const game = createGame([1], 1)
  game.phase = 'property-decision'
  game.propertyOffer = { kind: 'purchase', parcelId: 83, amount: 1800, ownerId: null }
  const panel = mount(PropertyPanel, { props: { game, paused: false, assetProfile: 'hd' } })
  expect(panel.get('.amount img').attributes('src')).toBe('/hd-static/approved-01-12/ui/cash.webp')
})

it('无主但保留建筑等级的地产显示中立建筑，不把它画成空地出售牌', () => {
  const game=createGame([1,2,3,4],1)
  game.phase='property-decision';game.propertyOffer={kind:'purchase',parcelId:47,amount:2000,ownerId:null};game.properties[47]={ownerId:null,level:3}
  const panel=mount(PropertyPanel,{props:{game,paused:false}})
  expect(panel.get('[data-testid="property-current-art"]').attributes('src')).toBe('/assets/world/neutral-houses/2/3.png')
  expect(panel.get('[data-testid="property-current-art"]').attributes('alt')).toContain('中立3级建筑')
})

it('人类出局但AI仍存活的终局文案准确区分，不宣称全部玩家出局', () => {
 const game=createGame([1],1);game.phase='ended';game.outcome={kind:'defeat',winnerId:null};game.eliminatedPlayerIds=[1]
 const panel=mount(EndgamePanel,{props:{game,paused:false}})
 expect(panel.get('h2').text()).toBe('人类玩家已出局，对局结束')
 expect(panel.text()).toContain('存活')
})
