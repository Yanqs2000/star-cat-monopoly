// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect,it } from 'vitest'
import GameLoading from '../../src/modern/features/game/GameLoading.vue'
it('开局进度页使用角色索引中的卷毛图片路径，显示真实完成进度',()=>{
 const panel=mount(GameLoading,{props:{players:[{characterId:1,name:'卷毛'}],profile:'original',stage:'准备场景与角色动画',progress:{completed:2,total:8}}})
 expect(panel.get('img').attributes('src')).toBe('/assets/walk/down-right/1.png')
 expect(panel.get('progress').element.value).toBe(2)
 expect(panel.text()).toContain('25%')
})
