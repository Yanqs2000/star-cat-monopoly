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
  expect(image.attributes('src')).toContain('/assets-hd/companies/dialog.webp')

  await wrapper.setProps({assetProfile:'original'})
  await nextTick()
  expect(image.attributes('src')).toContain('/assets/companies/dialog.png')
  wrapper.unmount()
})
