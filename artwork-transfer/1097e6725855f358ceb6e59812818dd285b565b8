import type { GameState } from '../game/types'
export interface SaveSnapshot {
 format:'star-cat-monopoly'
 formatVersion:1
 rulesVersion:'modern-3d-v1'
 createdAt:string
 savedAt:string
 selection:number[]
 settings:{speed:1|2;paused:boolean}
 state:GameState
}
export interface SaveSlot {slot:1|2|3;revision:number;savedAt:string|null;summary:{round:number;date:string;players:string[]}|null}
export interface SaveRecord {slot:1|2|3;revision:number;snapshot:SaveSnapshot}
