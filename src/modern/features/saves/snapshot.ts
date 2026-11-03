import Ajv from 'ajv'
import schema from './snapshot.schema.json'
import type { SaveSnapshot } from './snapshot-types'
import type { GameState } from '../game/types'
import map from '../../data/map.json'
import worldRules from '../../data/world-rules.json'
import { getCardCell, getCardRecord } from '../game/direct-cards'
import { assertCalendarDate } from '../game/calendar'
import { getOutcome } from '../game/lifecycle'

const validate=new Ajv({strict:true,strictNumbers:true,allErrors:false}).compile(schema)
const cardIds=new Set([1,5,6,7,9,11,14,15,18,19,20,21,22,25,26,27,33])
function requireValue(value:unknown,message:string):asserts value {if(!value)throw new Error(`存档无效：${message}`)}
function integer(value:number,min=0,max=Number.MAX_SAFE_INTEGER){requireValue(Number.isSafeInteger(value)&&value>=min&&value<=max,'整数范围')}
function keys(value:object,expected:number[]){const actual=Object.keys(value);requireValue(actual.length===expected.length&&actual.every(k=>expected.some(id=>String(id)===k)),'记录缺项或未知键')}
function unique(values:number[]){requireValue(new Set(values).size===values.length,'重复记录')}
function stamp(value:string){requireValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value,'保存时间')}
function safeJson(value:unknown,depth=0):void {
 requireValue(depth<40,'层级过深')
 if(typeof value==='number')requireValue(Number.isFinite(value),'非有限数值')
 if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
  requireValue(!['__proto__','prototype','constructor'].includes(key),'禁止的对象键');safeJson(child,depth+1)
 }
}
export function canSaveGame(state:GameState):boolean {
 if(state.phase==='ended')return state.outcome!==null&&state.interaction===null&&state.continuation===null&&state.remainingSteps===0&&state.propertyOffer===null
 const player=state.players[state.activePlayerIndex]
 return state.phase==='awaiting-roll'&&state.interaction===null&&state.continuation===null&&state.propertyOffer===null&&state.remainingSteps===0&&
  player!==undefined&&!state.eliminatedPlayerIds.includes(player.id)&&state.outcome===null
}
export function parseSnapshot(value:unknown):SaveSnapshot {
 safeJson(value)
 requireValue(validate(value),'格式、字段或版本不匹配')
 const snap=value as SaveSnapshot;const g=snap.state
 stamp(snap.createdAt);stamp(snap.savedAt);requireValue(snap.createdAt<=snap.savedAt,'保存时间早于创建时间')
 requireValue(g.players.length===4,'玩家必须保留四个稳定座位')
 const ids=[1,2,3,4];requireValue(g.players.every((p,i)=>p.id===i+1),'玩家座位ID')
 const characters=g.players.map(p=>p.characterId);unique(characters);unique(g.players.map(p=>p.hometown))
 unique(snap.selection);requireValue(snap.selection.length>=1&&snap.selection.length<=4&&snap.selection.every(id=>characters.includes(id)),'开局角色顺序')
 unique(g.eliminatedPlayerIds);unique(g.stayPlayerIds)
 for(const id of [...g.eliminatedPlayerIds,...g.stayPlayerIds])requireValue(ids.includes(id),'玩家引用')
 for(const record of [g.inventories,g.credit,g.forcedDice,g.tickets,g.world.statuses,g.finance.loans])keys(record,ids)
 keys(g.properties,map.parcels.map(p=>p.id));keys(g.prices,map.parcels.map(p=>p.id))
 integer(g.activePlayerIndex,0,3);integer(g.round,1);integer(g.rngState,0,0xffffffff)
 integer(g.remainingSteps,0,6);if(g.lastRoll!==null)integer(g.lastRoll,1,6)
 assertCalendarDate(g.world);integer(g.world.weekday,0,6);integer(g.world.elapsedDays)
 for(const p of g.players){
  integer(p.characterId,1,12);requireValue(typeof p.name==='string'&&p.name.length>0&&p.name.length<100,'角色名称')
  const cell=getCardCell(p.position);requireValue(cell!==undefined&&cell.type>0&&cell.type<34,'玩家地图坐标')
  integer(p.cash,-Number.MAX_SAFE_INTEGER);integer(p.deposit,-Number.MAX_SAFE_INTEGER)
  const status=g.world.statuses[p.id]!;integer(status.days);integer(status.godDays)
  requireValue(status.godId===null||worldRules.godIds.includes(status.godId),'神灵引用')
  const cards=g.inventories[p.id]!;requireValue(cards.length<=24&&cards.every(id=>cardIds.has(id)),'卡牌或手牌容量')
  integer(g.tickets[p.id]!,-Number.MAX_SAFE_INTEGER);integer(g.finance.loans[p.id]!)
  const credit=g.credit[p.id]!;integer(credit.used);integer(credit.available);integer(credit.score)
  if(g.forcedDice[p.id]!==null)integer(g.forcedDice[p.id]!,1,6)
  if(g.eliminatedPlayerIds.includes(p.id))requireValue(p.cash===0&&p.deposit===0&&cards.length===0&&g.tickets[p.id]===0&&g.finance.loans[p.id]===0&&credit.used===0&&credit.available===0&&credit.score===0,'淘汰者资产未清算')
 }
 for(const property of Object.values(g.properties))requireValue(property.ownerId===null||ids.includes(property.ownerId)&&!g.eliminatedPlayerIds.includes(property.ownerId),'地产所有者')
 for(const price of Object.values(g.prices))requireValue(price>=0,'地产价格')
 for(const [key,marker] of Object.entries(g.world.markers)){
  requireValue(String(Number(key))===key&&getCardRecord(Number(key))!==undefined,'地图标记引用')
  integer(marker,1,15);requireValue(marker!==8,'未开放标记')
 }
 for(const amount of g.lostAndFoundFunds)integer(amount);integer(g.unownedOwnerDeposit,-Number.MAX_SAFE_INTEGER)
 requireValue(g.finance.stocks.length===16,'股票记录不完整')
 for(const [i,stock] of g.finance.stocks.entries()){
  requireValue(stock.id===i,'股票ID');keys(stock.holdings,ids)
  requireValue(stock.kind===(i===0?0:i>=13?3:characters.includes(i)?2:1),'公司类别')
  requireValue(stock.ceoId===null||ids.includes(stock.ceoId)&&!g.eliminatedPlayerIds.includes(stock.ceoId),'董事引用')
  requireValue(getCardRecord(stock.mainRecordId)!==undefined,'公司地图引用')
  integer(stock.dailyBuyLimit);integer(stock.offerShares);integer(stock.poolBandValue,-Number.MAX_SAFE_INTEGER)
  for(const [key,h] of Object.entries(stock.holdings)){
   integer(h.shares);requireValue(h.averageCost>=0,'持股成本')
   if(g.eliminatedPlayerIds.includes(Number(key)))requireValue(h.shares===0&&h.averageCost===0,'淘汰者持股未清算')
  }
 }
 for(const entry of g.finance.entries){if(entry.playerId!==undefined)requireValue(ids.includes(entry.playerId),'金融玩家引用');if(entry.companyId!==undefined)integer(entry.companyId,0,15)}
 if(g.finance.lastSettledMonth!==null){
  const key=g.finance.lastSettledMonth;requireValue(/^\d+-\d{1,2}$/.test(key),'月结键')
  const [year,month]=key.split('-').map(Number) as [number,number];assertCalendarDate({year,month,day:1})
  requireValue(key===`${year}-${month}`&&(year<g.world.year||year===g.world.year&&month<=g.world.month),'月结键不是引擎的已结算月份')
 }
 if(g.finance.monthlyQuoteIndex!==null)integer(g.finance.monthlyQuoteIndex)
 unique(g.bankruptcyReceipts.map(r=>r.playerId))
 requireValue(g.bankruptcyReceipts.length===g.eliminatedPlayerIds.length,'清算记录缺项')
 for(const r of g.bankruptcyReceipts){
  requireValue(g.eliminatedPlayerIds.includes(r.playerId),'清算玩家引用');integer(r.round,1,g.round)
  for(const [id,amount] of Object.entries(r.sharesReturned)){integer(Number(id),1,15);integer(amount)}
  requireValue(r.propertyIds.every(id=>Object.hasOwn(g.properties,id)),'清算地产引用')
 }
 for(const key of Object.keys(g.pendingControl))requireValue(ids.some(id=>String(id)===key)&&!g.eliminatedPlayerIds.includes(Number(key)),'控制切换引用')
 if(g.lastPropertyEvent){const e=g.lastPropertyEvent;requireValue(Object.hasOwn(g.properties,e.parcelId)&&ids.includes(e.playerId)&&(e.recipientId===undefined||e.recipientId===0||ids.includes(e.recipientId)),'历史地产引用')}
 for(const point of g.turnPath){const cell=getCardCell(point);requireValue(cell!==undefined&&cell.type>0&&cell.type<34,'路径坐标')}
 requireValue(canSaveGame(g),'只能保存稳定等待操作或终局')
 if(g.phase==='ended'){const outcome=getOutcome(g);requireValue(outcome?.kind===g.outcome?.kind&&outcome?.winnerId===g.outcome?.winnerId,'终局结果与存活者不一致')}
 return JSON.parse(JSON.stringify(snap)) as SaveSnapshot
}
export function createSnapshot(state:GameState,selection:number[],settings:SaveSnapshot['settings'],createdAt:string,now:string):SaveSnapshot {
 return parseSnapshot({format:'star-cat-monopoly',formatVersion:1,rulesVersion:'modern-3d-v1',createdAt,savedAt:now,selection,settings,state})
}
