// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import DiceRoll from '../../src/modern/features/game/DiceRoll.vue'

afterEach(() => vi.useRealTimers())
it('骰子先翻滚再显示真实结果，暂停期间不结束，恢复后只完成一次', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] })
  const panel = mount(DiceRoll, { props: { roll: { playerId: 1, value: 6, durationMs: 900 }, playerName: '卷毛', paused: false, speed: 1, assetProfile: 'hd' } })
  expect(panel.attributes('data-stage')).toBe('rolling')
  const firstFace = panel.get('img').attributes('src')
  await vi.advanceTimersByTimeAsync(300)
  expect(panel.get('img').attributes('src')).not.toBe(firstFace)
  await panel.setProps({ paused: true }); await vi.advanceTimersByTimeAsync(5000)
  expect(panel.attributes('data-stage')).toBe('rolling')
  expect(panel.emitted('complete')).toBeUndefined()
  await panel.setProps({ paused: false }); await vi.advanceTimersByTimeAsync(300)
  expect(panel.attributes('data-stage')).toBe('result')
  expect(panel.text()).toContain('卷毛掷出 6 点')
  expect(panel.get('img').attributes('src')).toContain('hd-static/activities/ludo-face-6/1.webp')
  await vi.advanceTimersByTimeAsync(3000)
  expect(panel.emitted('complete')).toEqual([[]])
  panel.unmount()
})
