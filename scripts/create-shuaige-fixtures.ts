import{writeFile}from'node:fs/promises'
import rules from'../src/modern/data/rules.json'
import{createGame}from'../src/modern/features/game/setup'
import{createSnapshot}from'../src/modern/features/saves/snapshot'
import{roll,step}from'../src/modern/features/game/turns'
import{PORTALS,createPortalFlight}from'../src/modern/features/game/portal'
import{settleBankruptcy,getOutcome}from'../src/modern/features/game/lifecycle'
import type{Direction,GameState}from'../src/modern/features/game/types'
const deltas=[[1,1],[-1,1],[-1,-1],[1,-1]]as const,selection=[7,1,11,2],stamp='2026-11-01T00:00:00.000Z'
const road=(p:{column:number;row:number})=>rules.roadCells.some(r=>r.coordinate.column===p.column&&r.coordinate.row===p.row)
function entry(target:{column:number;row:number}){
 const p=deltas.map(([dx,dy],i)=>({position:{column:target.column-dx,row:target.row-dy},direction:(i+1)as Direction})).find(p=>road(p.position))!
 if(!p)throw Error('missing native predecessor');return p
}
function base():GameState{const g=createGame(selection,1,1);g.world.markers={};return g}
function before(target:{column:number;row:number},g=base(),seat=0){
 Object.assign(g.players[seat]!,entry(target));g.activePlayerIndex=seat;g.forcedDice[seat+1]=1
 const arrived=step(roll(g,1));if(JSON.stringify(arrived.players[seat]!.position)!==JSON.stringify(target))throw Error('bad source route')
 return g
}
async function save(name:string,g:GameState){await writeFile(new URL('../tests/fixtures/shuaige-'+name+'.json',import.meta.url),JSON.stringify(createSnapshot(g,selection,{speed:1,paused:false},stamp,stamp),null,2)+'\n')}
const pair=before({column:26,row:10});Object.assign(pair.players[1]!,{position:{column:28,row:10},direction:2});pair.forcedDice[2]=1
await save('pair',pair)
for(const godId of[2,3,4,5,10,11]){const g=structuredClone(pair);g.world.statuses[1]!.godId=godId;g.world.statuses[1]!.godDays=7;await save('god-'+godId,g)}
await save('carnival',before(rules.roadCells.find(c=>c.kind===28)!.coordinate))
for(const name of['happy','sad','hurt']){
 const target=name==='happy'?rules.roadCells.find(c=>c.kind===24)!.coordinate:rules.roadCells.find(c=>c.id===221)!.coordinate
 const g=before(target);g.inventories[1]=[1]
 if(name!=='happy')g.world.markers={221:name==='sad'?3:7}
 await save(name,g)
}
const portals=[];const seen=new Set<number>()
for(const from of PORTALS)for(const to of PORTALS){
 if(from.id===to.id)continue
 const heading=createPortalFlight(from.position,to.position).heading;if(seen.has(heading))continue
 seen.add(heading);const scenario='portal-h'+heading;await save(scenario,before(from.position));portals.push({scenario,heading,destination:to.id})
}
if(seen.size!==4)throw Error('all four native flight headings are required')
const walkTurns=[]
for(const initial of[1,2,3,4]){
 for(const cell of rules.roadCells){
  const g=base();g.players[0]!.position={...cell.coordinate};g.players[0]!.direction=initial as Direction;g.forcedDice[1]=6
  let current=roll(g,6);const directions:number[]=[],path=[];let valid=true
  try{while(current.phase==='moving'){directions.push(current.players[0]!.direction);current=step(current);const p=current.players[0]!.position;const cell=rules.roadCells.find(c=>c.coordinate.column===p.column&&c.coordinate.row===p.row)!;path.push(cell.id);if([18,19].includes(cell.kind))valid=false}}catch{valid=false}
  if(!valid||new Set(directions).size<2||directions.length!==6)continue
  const scenario='walk-turn-'+initial;await save(scenario,g);walkTurns.push({scenario,directions,path});break
 }
}
if(walkTurns.length!==4)throw Error('all starting directions need a native multi-cell turn route')
await writeFile(new URL('../tests/fixtures/shuaige-cases.json',import.meta.url),JSON.stringify({portals,walkTurns},null,2)+'\n')
const monthly=before({column:26,row:10},createGame(selection,1,0,{year:2026,month:2,day:1}),3);monthly.world.markers={};monthly.players[0]!.deposit=999999;await save('monthly',monthly)
let ended=base()
for(const id of[2,3,4]){ended.players[id-1]!.cash=0;ended.players[id-1]!.deposit=0;ended=settleBankruptcy(ended,id)}
ended.phase='ended';ended.outcome=getOutcome(ended);ended.interaction=null;ended.continuation=null;ended.propertyOffer=null;ended.remainingSteps=0;await save('endgame',ended)
console.log('21 legal native snapshots: Shuaige + Juanmao, four walking turn routes, four flight headings, six possession badges, reactions and settlement')
