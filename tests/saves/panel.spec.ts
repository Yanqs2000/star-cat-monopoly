// @vitest-environment jsdom
import { expect,it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { SaveSlot } from '../../src/modern/features/saves/snapshot-types'
import SavePanel from '../../src/modern/features/saves/SavePanel.vue'
const slots:SaveSlot[]=[{slot:1,revision:0,savedAt:null,summary:null},{slot:2,revision:4,savedAt:'2026-10-04T08:40:00.000Z',summary:{round:7,date:'2026-10-10',players:['妮妮','阿牛']}},{slot:3,revision:0,savedAt:null,summary:null}]
it('三槽显示服务器内容，空槽不可读，已有槽覆盖与加载需确认',async()=>{
 const p=mount(SavePanel,{props:{slots,canSave:true,busy:false,error:'',hasGame:true}})
 expect(p.text()).toContain('第7轮');expect(p.get('[data-testid="load-slot-1"]').attributes()).toHaveProperty('disabled')
 await p.get('[data-testid="save-slot-2"]').trigger('click');expect(p.emitted('save')).toBeUndefined()
 await p.get('[data-testid="save-confirm"]').trigger('click');expect(p.emitted('save')).toEqual([[2]])
 await p.get('[data-testid="load-slot-2"]').trigger('click');expect(p.emitted('load')).toBeUndefined()
 await p.get('[data-testid="load-confirm"]').trigger('click');expect(p.emitted('load')).toEqual([[2]])
})
it('不稳定或请求中禁止保存重复操作，错误信息不显示成功',async()=>{
 const p=mount(SavePanel,{props:{slots,canSave:false,busy:false,error:'服务不可用，当前对局保留',hasGame:true}})
 expect(p.get('[data-testid="save-slot-1"]').attributes()).toHaveProperty('disabled');expect(p.text()).toContain('当前对局保留')
 await p.setProps({canSave:true,busy:true});expect(p.get('[data-testid="load-slot-2"]').attributes()).toHaveProperty('disabled')
})
