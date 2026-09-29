import type { CarnivalInput } from './carnival'
export function listenCarnivalInputs(element:HTMLElement,enabled:()=>boolean,send:(input:CarnivalInput)=>void) {
 const left=['ArrowLeft','a','A'],right=['ArrowRight','d','D'],keys=[...left,...right,'ArrowUp','ArrowDown']
 const form=(event:KeyboardEvent)=>(event.target as HTMLElement|null)?.closest?.('input,select,textarea,[contenteditable=true]')
 const down=(event:KeyboardEvent)=>{
  if(!keys.includes(event.key)||form(event)||!enabled())return
  event.preventDefault();event.stopImmediatePropagation()
  if(left.includes(event.key))send({kind:'key',direction:-1})
  else if(right.includes(event.key))send({kind:'key',direction:1})
 }
 const up=(event:KeyboardEvent)=>{
  if(![...left,...right].includes(event.key)||form(event))return
  event.preventDefault();event.stopImmediatePropagation();send({kind:'key',direction:0})
 }
 const pointer=(event:PointerEvent)=>{
  if(!enabled())return
  event.stopPropagation();const rect=element.getBoundingClientRect();if(rect.width>0)send({kind:'pointer',x:(event.clientX-rect.left)/rect.width*800})
 }
 const release=()=>send({kind:'key',direction:0})
 document.addEventListener('keydown',down,true);document.addEventListener('keyup',up,true);window.addEventListener('blur',release);element.addEventListener('pointermove',pointer)
 return ()=>{document.removeEventListener('keydown',down,true);document.removeEventListener('keyup',up,true);window.removeEventListener('blur',release);element.removeEventListener('pointermove',pointer);release()}
}
