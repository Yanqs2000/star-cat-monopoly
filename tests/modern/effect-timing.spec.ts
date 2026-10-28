import {expect,it} from 'vitest'
import {activityPresentationFrame,missilePresentationSchedule,effectAnchor} from '../../src/modern/features/assets/effect-timing'
it('烟雾38帧显示不改变18/19帧源时钟：子帧受当前业务帧约束',()=>{
 expect(activityPresentationFrame(1,0,60,38)).toBe(1)
 expect(activityPresentationFrame(1,17,60,38)).toBe(2)
 expect(activityPresentationFrame(18,17,60,38)).toBe(36)
 expect(activityPresentationFrame(18,1000,60,38)).toBe(36)
 expect(activityPresentationFrame(19,17,60,38)).toBe(38)
 expect(activityPresentationFrame(18,1000,30,19)).toBe(18)
})
it('高清火箭按Flash第40帧换落点，第80帧之后爆炸；原画质路径不变',()=>{
 expect(missilePresentationSchedule('original')).toBeUndefined()
 const schedule=missilePresentationSchedule('hd')!
 expect(schedule.relocateAtMs).toBe(1300)
 expect(schedule.explosionDelayMs).toBeCloseTo(8000/3)
 const origin={column:1,row:2},impact={column:3,row:4}
 expect(effectAnchor(origin,impact,1299,schedule.relocateAtMs)).toEqual(origin)
 expect(effectAnchor(origin,impact,1300,schedule.relocateAtMs)).toEqual(impact)
 expect(effectAnchor(origin,impact,4000,schedule.relocateAtMs)).toEqual(impact)
})
