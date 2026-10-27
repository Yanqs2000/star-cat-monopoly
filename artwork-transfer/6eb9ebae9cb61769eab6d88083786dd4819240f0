import { expect,it } from 'vitest'
import { commitPreparedSave } from '../../src/modern/features/saves/restore'
it('候选准备失败保留旧局，只有完整准备成功才提交替换',async()=>{
 let current={cash:100};let released=0
 await expect(commitPreparedSave(async()=>{throw new Error('image404')},candidate=>{current=candidate},()=>released++)).rejects.toThrow('image404')
 expect(current).toEqual({cash:100})
 await commitPreparedSave(async()=>({cash:20}),candidate=>{current=candidate},()=>released++)
 expect(current).toEqual({cash:20});expect(released).toBe(0)
})
it('关闭/过期候选或提交异常释放新资源而不触碰旧资源',async()=>{
 let released=0;const candidate={disposed:false}
 await expect(commitPreparedSave(async()=>candidate,()=>{throw new Error('cancelled')},c=>{c.disposed=true;released++})).rejects.toThrow('cancelled')
 expect(released).toBe(1);expect(candidate.disposed).toBe(true)
})
