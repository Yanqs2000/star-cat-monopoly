// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SavePanel from '../../src/modern/features/saves/SavePanel.vue'
import type { SaveSlot } from '../../src/modern/features/saves/snapshot-types'

const slots: SaveSlot[] = [
  { slot: 1, revision: 4, savedAt: '2026-10-27T07:08:00.000Z', summary: { round: 17, date: '2026年10月27日', players: ['妮妮', '阿牛', '自定义玩家'] } },
  { slot: 2, revision: 0, savedAt: null, summary: null },
  { slot: 3, revision: 2, savedAt: null, summary: null },
]
const render = () => mount(SavePanel, { props: { slots, canSave: true, busy: false, error: '', hasGame: true } })

it('以命名的存档卡和真实摘要分组显示已有、空白与异常槽位', () => {
  const panel = render()
  const saved = panel.get('[data-testid="save-row-1"]')
  expect(saved.attributes('aria-label')).toBe('槽位 1，已有存档')
  expect(saved.get('time').attributes('datetime')).toBe(slots[0]!.savedAt)
  expect(saved.get('time').text()).toMatch(/^2026\/10\/27/)
  expect(saved.text()).toContain('第17轮')
  expect(saved.text()).toContain('2026年10月27日')
  expect(saved.get('[aria-label="对局玩家"]').text()).toContain('自定义玩家')
  expect(saved.findAll('[aria-label="对局玩家"] img')).toHaveLength(0)
  expect(panel.get('[data-testid="save-row-2"]').attributes('aria-label')).toBe('槽位 2，空槽')
  expect(panel.get('[data-testid="save-row-3"]').attributes('aria-label')).toBe('槽位 3，摘要异常')
})

it('确认区明确显示目标槽位且取消不会发出操作', async () => {
  const panel = render()
  await panel.get('[data-testid="save-slot-1"]').trigger('click')
  expect(panel.get('[role="alertdialog"]').text()).toContain('槽位 1')
  await panel.get('[role="alertdialog"]').findAll('button')[1]!.trigger('click')
  expect(panel.find('[role="alertdialog"]').exists()).toBe(false)
  expect(panel.emitted('save')).toBeUndefined()
  await panel.get('[data-testid="load-slot-1"]').trigger('click')
  await panel.get('[data-testid="load-confirm"]').trigger('click')
  expect(panel.emitted('load')).toEqual([[1]])
})

it('请求中显示忙碌语义并保留错误、重试、刷新与关闭事件', async () => {
  const panel = render()
  await panel.setProps({ busy: true, error: '服务不可用，当前对局保留', retryable: true })
  expect(panel.get('[role="dialog"]').attributes('aria-busy')).toBe('true')
  expect(panel.get('[role="alert"]').text()).toContain('服务不可用，当前对局保留')
  expect(panel.get('[data-testid="save-slot-1"]').attributes()).toHaveProperty('disabled')
  await panel.setProps({ busy: false })
  for (const text of ['重新查看槽位', '重试同一保存请求', '关闭，返回对局']) {
    await panel.findAll('button').find(button => button.text().includes(text))!.trigger('click')
  }
  expect(panel.emitted('refresh')).toEqual([[]])
  expect(panel.emitted('retry')).toEqual([[]])
  expect(panel.emitted('close')).toEqual([[]])
})
