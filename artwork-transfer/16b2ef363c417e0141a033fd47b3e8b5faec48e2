import geometry from '../../data/carnival-geometry.json'
import { randomInt } from './random'
export type CarnivalInput={kind:'key';direction:-1|0|1}|{kind:'pointer';x:number}
export interface CarnivalBall {id:number;kind:1|2|3|4;x:number;y:number;frame:number;creation:number}
export interface CarnivalGame {
 stage:'intro'|'play'|'tally'|'done';characterId:number;frame:number;remainingTenths:number;remainderMs:number;x:number;pose:1|2|3;boyFrame:number;input:CarnivalInput;
 balls:CarnivalBall[];counts:number[];generated:number[];serial:number;coinSerial:number;creation:number;targets:Record<number,number>;scanFrom:number;
 aiStage:0|1|2;aiTarget:number;aiAim:number;aiDirection:number;score:number;tallyFrames:number;idleCounts:number;paid:boolean
}
const points=[1,5,8,30],fall=[1.5,5,8,16]
export function beginCarnival(characterId:number,rngState:number) {
 return {rngState:randomInt(rngState,3).nextState,game:{stage:'intro',characterId,frame:0,remainingTenths:200,remainderMs:0,x:400,pose:1,boyFrame:1,input:{kind:'key',direction:0},balls:[],counts:[0,0,0,0],generated:[0,0,0,0],serial:10,coinSerial:0,creation:0,targets:{},scanFrom:9,aiStage:0,aiTarget:0,aiAim:0,aiDirection:0,score:0,tallyFrames:0,idleCounts:0,paid:false} as CarnivalGame}
}
export function setCarnivalInput(game:CarnivalGame,input:CarnivalInput):CarnivalGame {
 if(!['intro','play'].includes(game.stage)||input.kind==='pointer'&&!Number.isFinite(input.x)||input.kind==='key'&&![-1,0,1].includes(input.direction))return game
 return {...game,input:input.kind==='pointer'?{...input,x:Math.max(30,Math.min(770,input.x))}:input}
}
function intersects(ball:CarnivalBall,game:CarnivalGame) {
 const b=geometry.ball[ball.kind-1]![ball.frame-1]!,a=game.pose===1?geometry.boy[game.characterId-1]![0]!:geometry.walk[game.characterId-1]![game.pose-2]![game.boyFrame-1]!
 return ball.x+b[0]!<=game.x+a[1]!&&ball.x+b[1]!>=game.x+a[0]!&&ball.y+b[2]!<=500+a[3]!&&ball.y+b[3]!>=500+a[2]!
}
export function advanceCarnival(game:CarnivalGame,rngState:number,ai:boolean) {
 if(game.stage==='done')return {game,rngState,credit:0}
 const g={...game,frame:game.frame+1,balls:game.balls.map(b=>({...b})),counts:[...game.counts],generated:[...game.generated],targets:{...game.targets}}
 let credit=0
 if(g.pose!==1)g.boyFrame=g.boyFrame%geometry.walk[g.characterId-1]![g.pose-2]!.length+1
 // Native falling callbacks run in reverse creation order before the older boy callback.
 const removed=new Set<number>()
 for(const ball of [...g.balls].sort((a,b)=>b.creation-a.creation)) {
  ball.frame=ball.frame%30+1;ball.y+=fall[ball.kind-1]!
  if(ball.y>400&&ball.y<500&&intersects(ball,g)) {
   g.counts[ball.kind-1]++;removed.add(ball.creation);if(ball.kind>1)g.aiStage=0
  } else if(ball.y>=500)removed.add(ball.creation)
  if(removed.has(ball.creation)) {
   // clear0 parses only two serial digits, including the source coin/AI mirror behavior.
   const key=Number(String(ball.id).slice(0,2));g.targets[key]=0
   if(ball.kind===2)g.scanFrom=key
  }
 }
 g.balls=g.balls.filter(b=>!removed.has(b.creation))
 if(game.stage==='play'||game.stage==='intro') {
  if(ai) {
   if(g.aiStage===0&&g.serial>11) {
    let best=10000
    for(let id=Math.max(11,g.scanFrom);id<=g.serial;id++) {
     const kind=g.targets[id],ball=g.balls.find(b=>b.id===id&&b.kind===kind)
     if(!ball||kind===undefined||kind<=1)continue
     const dx=g.x-ball.x,time=(500-ball.y)/fall[kind-1]!,cost=time/points[kind-1]!
     if(time>Math.abs(dx/8)&&cost<best){best=cost;g.aiTarget=id;g.aiAim=ball.x;g.aiDirection=dx<0?-1:1}
    }
    g.aiStage=1
   } else if(g.aiStage===1) {
    if(Math.abs(g.x-g.aiAim)>8){g.x-=g.aiDirection*8;g.pose=g.aiDirection===1?2:3}
    else {g.x=g.aiAim;g.pose=1;g.aiStage=2}
   } else if(g.aiStage===2&&g.targets[g.aiTarget]===0)g.aiStage=0
  } else if(g.input.kind==='key') {
   if(g.input.direction===0)g.pose=1
   else if(g.input.direction===-1&&g.x-8>30){g.x-=8;g.pose=2}
   else if(g.input.direction===1&&g.x+8<770){g.x+=8;g.pose=3}
  } else {
   const delta=g.input.x-g.x
   if(Math.abs(delta)>8){g.x+=Math.sign(delta)*8;g.pose=delta<0?2:3}
   else {g.x=g.input.x;g.pose=1;g.input={kind:'key',direction:0}}
  }
  if(g.pose===1||game.pose===1)g.boyFrame=1
  const spawn=(kind:1|2|3|4)=>{
   const draw=randomInt(rngState,760);rngState=draw.nextState
   const id=kind===1?++g.coinSerial:++g.serial;g.generated[kind-1]++
   if(kind>1)g.targets[id]=kind
   g.balls.push({id,kind,x:20+draw.value,y:0,frame:1,creation:++g.creation})
  }
  if(game.stage==='intro') {
   if(g.frame>=90){rngState=randomInt(rngState,1000).nextState;g.stage='play';g.frame=0}
  } else {
   // Normalize native timers onto the fixed frame clock in their observed tie order.
   if(g.frame%3===0)g.remainingTenths--
   if(g.remainingTenths===0){g.stage='tally';g.pose=1;g.boyFrame=1;g.input={kind:'key',direction:0}}
   else {
    if(g.frame===300){spawn(4);g.aiStage=0}
    if(g.frame%90===0&&g.frame%180!==0){spawn(3);spawn(1)}
    else {
     if(g.frame%45===0)spawn(1)
     if(g.frame%60===0)spawn(2)
     if(g.frame%90===0)spawn(3)
    }
   }
  }
 } else {
  g.tallyFrames++
  if(g.tallyFrames%4===0) {
   let kind=3;while(kind>=0&&g.counts[kind]===0)kind--
   if(kind>=0){g.counts[kind]--;g.score+=points[kind]!}
   else if(g.idleCounts<15)g.idleCounts++
   else {g.stage='done';g.paid=true;credit=g.score}
  }
 }
 return {game:g,rngState,credit}
}
/** Integer fixed steps; this adapter also verifies identical display refresh partitions. */
export function advanceCarnivalTime(game:CarnivalGame,rngState:number,elapsedMs:number,ai:boolean) {
 let remainder=game.remainderMs+elapsedMs,credit=0
 while(remainder+1e-8>=1000/30) {
  const r=advanceCarnival(game,rngState,ai);game=r.game;rngState=r.rngState;credit+=r.credit;remainder-=1000/30
 }
 return {game:{...game,remainderMs:Math.abs(remainder)<1e-8?0:remainder},rngState,credit}
}
