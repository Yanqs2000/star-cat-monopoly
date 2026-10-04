import { randomInt } from './random'
export interface LudoCell { type:0|1|2; value:number; payout:number }
const row=(type:0|1|2,values:number[],payouts:number[]):LudoCell[]=>values.map((value,i)=>({type,value,payout:payouts[i]!}))
export const LUDO_CELLS:LudoCell[]=[
 ...row(0,[111,222,333,444,555,666],[100,80,80,80,80,100]),
 ...[4,5,6,7].flatMap((sum,i)=>[{type:1 as const,value:sum,payout:20},...row(2,[0,0,1,1],[2,2,2,2]),{type:1 as const,value:17-i,payout:20}]),
 ...row(1,[8,9,10,11,12,13],[8,10,10,10,10,8])]
export interface LudoGame {
 musicIndex:number;stage:'betting'|'rolling'|'payout'|'awards'|'done';frame:number;remaining:number;initialChips:number;debit:number;
 bets:number[];placements:number[];faces:[number,number,number];displayFaces:[number,number,number];payout:number;credit:number;paid:boolean;winningCells:number[]
}
export function beginLudo(tickets:number,rngState:number) {
 const initialChips=Math.max(1,Math.min(10,Math.trunc(tickets/10))),debit=Math.min(tickets,initialChips*10)
 // The original music choice still consumes the shared random stream.
 const music=randomInt(rngState,3)
 return {debit,rngState:music.nextState,game:{musicIndex:music.value,stage:'betting',frame:0,remaining:initialChips,initialChips,debit,
  bets:Array(36).fill(0),placements:[],faces:[1,1,1],displayFaces:[1,1,1],payout:0,credit:0,paid:false,winningCells:[]} as LudoGame}
}
export function wagerCell(id:number) {
 const cell=LUDO_CELLS[id];return cell?.type===2 ? cell.value===0?7:9 : id
}
export function placeWager(game:LudoGame,id:number):LudoGame {
 if(game.stage!=='betting'||game.remaining<=0||!Number.isInteger(id)||!LUDO_CELLS[id])return game
 const canonical=wagerCell(id),bets=[...game.bets];bets[canonical]++
 return {...game,remaining:game.remaining-1,bets,placements:[...game.placements,canonical]}
}
export function confirmWagers(game:LudoGame):LudoGame {
 return game.stage==='betting'?{...game,stage:'rolling',frame:0}:game
}
export function advanceLudo(game:LudoGame,rngState:number,ai:boolean):{game:LudoGame;rngState:number;credit:number} {
 if(game.stage==='done'||game.stage==='betting'&&!ai)return {game,rngState,credit:0}
 let g={...game,frame:game.frame+1},credit=0
 const draw=(bound:number)=>{const r=randomInt(rngState,bound);rngState=r.nextState;return r.value}
 if(g.stage==='betting') {
  if(g.remaining>0) {
   if(g.frame===30)g=placeWager(g,draw(2)===0?7:9)
   else if(g.frame===40){const sum=4+draw(14);g=placeWager(g,LUDO_CELLS.findIndex(c=>c.type===1&&c.value===sum))}
   else if(g.frame===50)g=placeWager(g,draw(6))
  }
  if(g.frame>=70)g=confirmWagers(g)
 } else if(g.stage==='rolling') {
  if(g.frame===1||g.frame===10) {
   g.faces=[draw(6)+1,draw(6)+1,draw(6)+1]
   // Source frame1/10 intentionally writes tz2 twice; retain the original visual.
   g.displayFaces=[g.faces[0],g.faces[2],1]
  } else if(g.frame>=17&&g.frame<=19){g.faces=[...g.faces];g.faces[g.frame-17]=draw(6)+1}
  if(g.frame>=40) {
   const sum=g.faces.reduce((a,b)=>a+b,0),triplet=g.faces.every(x=>x===g.faces[0])?g.faces[0]*111:0
   const winningCells=LUDO_CELLS.flatMap((cell,index)=>g.bets[index]!>0 && (cell.type===0?cell.value===triplet:cell.type===1?cell.value===sum: index===7?sum<=10:index===9&&sum>10)?[index]:[])
   const payout=winningCells.reduce((total,index)=>total+LUDO_CELLS[index]!.payout*g.bets[index]!,0)
   credit=payout>0?(g.remaining+payout)*10:0
   g={...g,stage:'payout',frame:0,payout,credit,paid:true,winningCells}
  }
 } else if(g.stage==='payout'&&g.frame>=60)g={...g,stage:g.payout>0?'awards':'done',frame:0}
 else if(g.stage==='awards'&&g.frame>=80)g={...g,stage:'done',frame:0}
 return {game:g,rngState,credit}
}
