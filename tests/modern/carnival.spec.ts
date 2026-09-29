import { readFileSync } from 'node:fs'
import { randomInt } from '../../src/modern/features/game/random'
import { expect,it } from 'vitest'
import { beginCarnival as rawBegin,advanceCarnival,setCarnivalInput,advanceCarnivalTime,type CarnivalGame } from '../../src/modern/features/game/carnival'
function beginCarnival(id:number,rng:number){let r=rawBegin(id,rng);for(let i=0;i<90;i++)r=advanceCarnival(r.game,r.rngState,false);return r}
it('20秒生成原四类型，音乐/落点使用同一随机；操作停止后逐项计分入账一次',()=>{
 let {game,rngState}=beginCarnival(1,1)
 for(let i=0;i<599;i++){const r=advanceCarnival(game,rngState,false);game=r.game;rngState=r.rngState;expect(r.credit).toBe(0)}
 expect(game.stage).toBe('play');expect(game.remainingTenths).toBe(1)
 const r=advanceCarnival(game,rngState,false);expect(r.game.stage).toBe('tally');expect(r.game.frame).toBe(600)
 expect(r.game.generated).toEqual([13,9,6,1]);expect(setCarnivalInput(r.game,{kind:'key',direction:1})).toBe(r.game)
 game={...r.game,balls:[],counts:[1,1,1,1]};rngState=r.rngState;let credit=0
 for(let i=0;i<150;i++){const next=advanceCarnival(game,rngState,false);game=next.game;rngState=next.rngState;credit+=next.credit}
 expect(game.stage).toBe('done');expect(game.score).toBe(44);expect(credit).toBe(44);expect(advanceCarnival(game,rngState,false).credit).toBe(0)
})
it('键盘8px严格边界，鼠标可到30/770且最后一步精确到目标；源碰撞先于演员移动',()=>{
 let g=setCarnivalInput(beginCarnival(1,1).game,{kind:'key',direction:-1})
 for(let i=0;i<100;i++)g=advanceCarnival(g,1,false).game;expect(g.x).toBe(32)
 g=setCarnivalInput(g,{kind:'pointer',x:0});g=advanceCarnival(g,1,false).game;expect(g.x).toBe(30)
 g=setCarnivalInput(g,{kind:'pointer',x:900});for(let i=0;i<100;i++)g=advanceCarnival(g,1,false).game;expect(g.x).toBe(770)
})
it('原包围盒边界63.5相交，63.55不交；接到/落出500每个只计一次',()=>{
 for(const [x,expected] of [[463.5,1],[463.55,0]]) {
  const g=beginCarnival(1,1).game;g.balls=[{id:1,kind:1,x:x!,y:478.5,frame:30,creation:1}]
  const next=advanceCarnival(g,1,false).game;expect(next.counts[0]).toBe(expected)
 }
 const g=beginCarnival(1,1).game;g.balls=[{id:1,kind:4,x:400,y:499,frame:1,creation:1}]
 expect(advanceCarnival(g,1,false).game.counts).toEqual([0,0,0,0])
})
it('同一输入记录在30/60/120显示刷新下得到相同完整状态和随机',()=>{
 const outputs=[]
 for(const fps of [30,60,120]) {
  let {game,rngState}=beginCarnival(3,2)
  for(let f=0;f<20*fps;f++) {
   const t=f/fps
   if(t===2)game=setCarnivalInput(game,{kind:'key',direction:-1})
   if(t===4)game=setCarnivalInput(game,{kind:'pointer',x:600})
   const r=advanceCarnivalTime(game,rngState,1000/fps,false);game=r.game;rngState=r.rngState
  }
  outputs.push({game,rngState})
 }
 expect(outputs[0]).toEqual(outputs[1]);expect(outputs[1]).toEqual(outputs[2])
})
it('AI按源可达价值选择，并在恢复后沿同一目标前进；剩余落物可在计分阶段接到',()=>{
 const g=beginCarnival(1,1).game;g.serial=12;g.balls=[{id:11,kind:2,x:420,y:200,frame:1,creation:1},{id:12,kind:3,x:600,y:100,frame:1,creation:2}];g.targets={11:2,12:3}
 let r=advanceCarnival(g,1,true);expect(r.game.aiStage).toBe(1);expect(r.game.aiTarget).toBe(12)
 r=advanceCarnival(JSON.parse(JSON.stringify(r.game)),r.rngState,true);expect(r.game.x).toBe(408)
 const tally: CarnivalGame={...beginCarnival(1,1).game,stage:'tally',balls:[{id:11,kind:2,x:400,y:400,frame:1,creation:1}]}
 expect(advanceCarnival(tally,1,false).game.counts[1]).toBe(1)
})

it('原整场受控运行的29次生成顺序/剩余时间逐项对应，倒数90帧另消耗原swapDepths随机',()=>{
 const source=JSON.parse(readFileSync('docs/modernization/evidence/carnival-runtime.json','utf8'))
 const expected=source.samples.filter((r:unknown[])=>r[0]==='spawn').map((r:(string|number)[])=>[Number(String(r[1]).slice(2)),r[2]])
 let r=rawBegin(1,1);let wanted=randomInt(r.rngState,1000).nextState
 for(let f=0;f<89;f++)r=advanceCarnival(r.game,r.rngState,false)
 expect(r.game.stage).toBe('intro');r=advanceCarnival(r.game,r.rngState,false);expect(r.game.stage).toBe('play');expect(r.rngState).toBe(wanted)
 const actual:number[][]=[]
 for(let f=0;f<600;f++){const before=r.game.creation;r=advanceCarnival(r.game,r.rngState,false);for(const b of r.game.balls.filter(b=>b.creation>before))actual.push([b.kind,r.game.remainingTenths])}
 expect(actual).toEqual(expected)
})

it('原子时间轴逐帧前进，左右切换保留同一子动画；停止才回站立，暂停恢复可序列化',()=>{
 const source=JSON.parse(readFileSync('docs/modernization/evidence/carnival-walk-runtime.json','utf8'))
 const rows=source.samples.filter((r:unknown[])=>r[0]==='walk-frame')
 let r=rawBegin(1,1)
 for(let f=0;f<85;f++) {
  if(f===0)r.game=setCarnivalInput(r.game,{kind:'key',direction:-1})
  if(f===35)r.game=setCarnivalInput(r.game,{kind:'key',direction:1})
  if(f===70)r.game=setCarnivalInput(r.game,{kind:'key',direction:0})
  r=advanceCarnival(JSON.parse(JSON.stringify(r.game)),r.rngState,false)
  expect([r.game.pose,r.game.boyFrame,r.game.x]).toEqual(rows[f].slice(2))
 }
})
