// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect,it } from 'vitest'
import LudoActivity from '../../src/modern/features/game/LudoActivity.vue'
import { beginLudo } from '../../src/modern/features/game/ludo'
it('原36格可分别下注，只提交格号；暂停禁下注，开奖只发一次命令',async()=>{
 const c=mount(LudoActivity,{props:{game:beginLudo(100,1).game,paused:false,human:true}})
 expect(c.findAll('[data-testid^="ludo-cell-"]')).toHaveLength(36)
 await c.get('[data-testid="ludo-cell-8"]').trigger('click');expect(c.emitted('wager')).toEqual([[8]])
 await c.setProps({paused:true});expect((c.get('[data-testid="ludo-cell-8"]').element as HTMLButtonElement).disabled).toBe(true)
 await c.setProps({paused:false});await c.get('[data-testid="ludo-confirm"]').trigger('click');expect(c.emitted('confirm')).toEqual([[]]);c.unmount()
})
