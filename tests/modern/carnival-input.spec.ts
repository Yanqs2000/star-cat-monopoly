// @vitest-environment jsdom
import { expect,it,vi } from 'vitest'
import { listenCarnivalInputs } from '../../src/modern/features/game/carnival-input'
it('小游戏独占方向键/A/D，鼠标转为源坐标；释放监听后不再吞普通输入',()=>{
 const el=document.createElement('div');document.body.append(el);el.getBoundingClientRect=()=>({left:10,width:400} as DOMRect)
 const send=vi.fn(),normal=vi.fn();document.addEventListener('keydown',normal)
 const cleanup=listenCarnivalInputs(el,()=>true,send)
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));expect(send).toHaveBeenLastCalledWith({kind:'key',direction:-1});expect(normal).not.toHaveBeenCalled()
 el.dispatchEvent(new MouseEvent('pointermove',{clientX:210,bubbles:true}));expect(send).toHaveBeenLastCalledWith({kind:'pointer',x:400})
 document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true,cancelable:true}));expect(send).toHaveBeenLastCalledWith({kind:'key',direction:0})
 cleanup();send.mockClear();document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));expect(send).not.toHaveBeenCalled();expect(normal).toHaveBeenCalledTimes(1)
 document.removeEventListener('keydown',normal);el.remove()
})
it('暂停不接受移动，失焦及销毁释放方向；表单方向键保持表单原输入',()=>{
 const el=document.createElement('div'),send=vi.fn(),cleanup=listenCarnivalInputs(el,()=>false,send)
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'d',cancelable:true}));expect(send).not.toHaveBeenCalled()
 window.dispatchEvent(new Event('blur'));expect(send).toHaveBeenLastCalledWith({kind:'key',direction:0});cleanup()
})
