// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

it('魔法门原选择场景可选原四站与保持原地，界面只提交站号', async () => {
  const game=createGame([1,2,3,4],1)
  game.phase='interaction';game.interaction={kind:'portal',playerId:1,stage:'choice'}
  const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[]}})
  expect(panel.find('[data-testid="portal-original"]').exists()).toBe(true)
  for(const destination of [1,2,3,4,5]) {
    await panel.get(`[data-testid="portal-${destination}"]`).trigger('click')
  }
  expect(panel.emitted('choose-portal')).toEqual([[1],[2],[3],[4],[5]])
  await panel.setProps({paused:true})
  expect((panel.get('[data-testid="portal-2"]').element as HTMLButtonElement).disabled).toBe(true)
  panel.unmount()
})

it('法院原被告列表仅包含合法目标，三案选择提交原0/1/2编号', async () => {
  const game=createGame([1,2,3,4],1)
  game.world.statuses[3]!.state=3;game.eliminatedPlayerIds=[4]
  game.phase='interaction';game.interaction={kind:'court',playerId:1,stage:'target'}
  const panel=mount(InteractionPanel,{props:{game,paused:false,cardAssets:[]}})
  expect(panel.find('[data-testid="court-original"]').exists()).toBe(true)
  expect(panel.findAll('[data-testid^="court-target-"]')).toHaveLength(1)
  await panel.get('[data-testid="court-target-2"]').trigger('click')
  expect(panel.emitted('court-target')).toEqual([[2]])
  await panel.setProps({game:{...game,interaction:{kind:'court',playerId:1,stage:'case',targetId:2}}})
  for(const caseId of [0,1,2])await panel.get(`[data-testid="court-case-${caseId}"]`).trigger('click')
  expect(panel.emitted('court-case')).toEqual([[0],[1],[2]])
  panel.unmount()
})
