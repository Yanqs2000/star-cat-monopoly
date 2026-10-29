import{writeFile}from'node:fs/promises'
import rules from'../src/modern/data/rules.json'
import{createGame}from'../src/modern/features/game/setup'
import{createSnapshot}from'../src/modern/features/saves/snapshot'
import{getCardRecord}from'../src/modern/features/game/direct-cards'
import{roll,step}from'../src/modern/features/game/turns'
import type{Direction}from'../src/modern/features/game/types'
const deltas=[[1,1],[-1,1],[-1,-1],[1,-1]] as const
for(const scenario of ['ludo','court','portal','dog','theft'] as const){
 const g=createGame([1,2,3,4],1,1),target=scenario==='ludo'?{column:3,row:25}:scenario==='court'?{column:36,row:10}:scenario==='portal'?{column:31,row:7}:getCardRecord(221)!.position
 const entry=deltas.map(([dx,dy],i)=>({position:{column:target.column-dx,row:target.row-dy},direction:(i+1)as Direction})).find(p=>rules.roadCells.some(c=>c.coordinate.column===p.position.column&&c.coordinate.row===p.position.row))!
 g.players[0]!.position=entry.position;g.players[0]!.direction=entry.direction;g.forcedDice[1]=1;g.world.markers=scenario==='dog'?{221:9}:scenario==='theft'?{221:14}:{};g.rngState=1
 const arrival=step(roll(g,1));if(JSON.stringify(arrival.players[0]!.position)!==JSON.stringify(target))throw Error('bad fixture predecessor')
 const stamp='2026-10-29T10:00:00.000Z',snapshot=createSnapshot(g,[1,2,3,4],{speed:1,paused:false},stamp,stamp)
 await writeFile(new URL('../tests/fixtures/continuous-'+scenario+'-snapshot.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n');console.log(scenario,entry,'→',target)
}
