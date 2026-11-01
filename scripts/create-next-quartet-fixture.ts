import {readFile,writeFile} from 'node:fs/promises'
import {createGame} from '../src/modern/features/game/setup'
import {createSnapshot} from '../src/modern/features/saves/snapshot'
const selected=[11,6,1,2],game=createGame(selected,1,1),stamp='2026-11-01T00:00:00.000Z'
const source=JSON.parse(await readFile(new URL('../tests/fixtures/guaika-pair.json',import.meta.url),'utf8'))
game.world.markers={}
for(let i=0;i<4;i++){
 const route=source.state.players[i%2]
 Object.assign(game.players[i]!,{position:{...route.position},direction:route.direction})
 game.forcedDice[i+1]=1
}
await writeFile(new URL('../tests/fixtures/next-character-quartet.json',import.meta.url),JSON.stringify(createSnapshot(game,selected,{speed:1,paused:false},stamp,stamp),null,2)+'\n')
console.log('Legal four-human fixture: Guaika, Weiwei, Juanmao and A-Niu; native one-step routes')
