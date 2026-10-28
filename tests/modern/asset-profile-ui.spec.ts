// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

it('同一公司交互组件在原子切换后改用当前画质的对话框资源', async () => {
  const game=createGame([1],1234,1)
  game.phase='interaction'
  game.interaction={kind:'company',playerId:1,companyId:1,resume:'company',chargeEntry:null}
  const wrapper=mount(InteractionPanel,{props:{game,paused:true,cardAssets:[],assetProfile:'original'}})
  const image=wrapper.get('[data-testid="company-original-frame"]')
  expect(image.attributes('src')).toContain('/assets/companies/dialog.png')

  await wrapper.setProps({assetProfile:'hd'})
  await nextTick()
  expect(image.attributes('src')).toContain('/hd-static/companies/dialog.webp')

  await wrapper.setProps({assetProfile:'original'})
  await nextTick()
  expect(image.attributes('src')).toContain('/assets/companies/dialog.png')
  wrapper.unmount()
})

it('已验收四个UI图标在主工具栏跟随画质切换',async()=>{
 const {default:GameToolbar}=await import('../../src/modern/features/game/GameToolbar.vue')
 const wrapper=mount(GameToolbar,{props:{game:createGame([1],1),detailsOpen:false,blocked:false,fullscreen:false,busy:false,status:'ready',assetProfile:'original'}})
 expect(wrapper.get('.brand-emblem').attributes('src')).toContain('/assets/ui/emblem.png')
 await wrapper.setProps({assetProfile:'hd'})
 for(const name of ['emblem','cash','deposit','tickets'])expect(wrapper.findAll('img').some(im=>im.attributes('src')?.includes(`/hd-static/approved-01-12/ui/${name}.webp`))).toBe(true)
 await wrapper.setProps({assetProfile:'original'});expect(wrapper.get('.brand-emblem').attributes('src')).toContain('/assets/ui/emblem.png');wrapper.unmount()
})

it('计算器与账户图标在高清交互中也使用已验收母版',async()=>{
 const game=createGame([1],1234,1);game.phase='interaction';game.interaction={kind:'company',playerId:1,companyId:1,resume:'company',chargeEntry:null}
 const wrapper=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[],assetProfile:'hd'}})
 await wrapper.get('[data-testid="company-subscribe"]').trigger('click')
 expect(wrapper.get('[data-testid="company-calculator"] img').attributes('src')).toContain('/hd-static/approved-01-12/companies/calculator.webp')
 wrapper.unmount();const {default:PlayerWallet}=await import('../../src/modern/features/game/PlayerWallet.vue');const wallet=mount(PlayerWallet,{props:{player:game.players[0]!,assetProfile:'hd'}});expect(wallet.get('.wallet-value img').attributes('src')).toContain('/hd-static/approved-01-12/ui/cash.webp');wallet.unmount()
})

it('地图信息、月结和购地面板的图标也覆盖到已验收高清版本',async()=>{
 const {default:MapInfoPanel}=await import('../../src/modern/features/game/MapInfoPanel.vue')
 const info=mount(MapInfoPanel,{props:{info:{kind:'place',name:'道路',position:{column:1,row:1}},assetProfile:'hd'}})
 expect(info.get('header img').attributes('src')).toContain('/hd-static/approved-01-12/ui/emblem.webp');info.unmount()
 const game=createGame([1,2,3,4],1)
 const {default:MonthlySettlement}=await import('../../src/modern/features/game/MonthlySettlement.vue')
 const monthly=mount(MonthlySettlement,{props:{game,entries:[],paused:false,assetProfile:'hd'}})
 expect(monthly.findAll('img').some(i=>i.attributes('src')?.includes('/hd-static/approved-01-12/ui/emblem.webp'))).toBe(true);monthly.unmount()
 game.phase='property-decision';game.propertyOffer={kind:'upgrade',parcelId:47,amount:2000,ownerId:2};game.properties[47]={ownerId:2,level:2}
 const {default:PropertyPanel}=await import('../../src/modern/features/game/PropertyPanel.vue')
 const property=mount(PropertyPanel,{props:{game,paused:false,assetProfile:'hd'}})
 expect(property.get('.amount img').attributes('src')).toContain('/hd-static/approved-01-12/ui/cash.webp');property.unmount()
})
