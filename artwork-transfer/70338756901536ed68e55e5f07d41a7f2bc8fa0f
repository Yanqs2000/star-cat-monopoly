import { createApp, h, ref } from 'vue'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
import { parseInteractionAssets } from '../../src/modern/features/game/interaction-assets'
import { mapAssetProfile } from '../../src/modern/features/assets/profiles'
import '../../src/modern/styles/original-ui.css'

const query=new URLSearchParams(location.search), scenario=query.get('scenario') ?? 'bank', profile=query.get('profile') === 'original' ? 'original' : 'hd'
const game=createGame([7,1,3,4],42), playerId=1
Object.assign(game.players[0]!,{cash:9500,deposit:42000});game.finance.loans[1]=12000;game.credit[1]!.used=23000;game.credit[1]!.available=77000
game.phase='interaction'
if(scenario==='bank')game.interaction={kind:'bank',playerId,resume:'after-bank'}
else if(scenario==='stock') {Object.assign(game.finance.stocks[1]!,{price:22.5,previousPrice:20,change:2.5,high:26,low:17.5,dailyBuyLimit:500});game.finance.stocks[1]!.holdings[1]={shares:7,averageCost:18};game.interaction={kind:'stock',playerId,resume:'after-stock'}}
else if(scenario==='shop')game.interaction={kind:'shop',playerId,resume:'shop',shop:{stock:[1,5,6,7,9,15,20,25,26,33,14,null]}}
else if(scenario==='dice'||scenario==='credit'||scenario==='target')game.interaction={kind:scenario==='dice'?'dice-choice':scenario==='credit'?'credit-choice':'target-choice',playerId,cardId:scenario==='dice'?5:scenario==='credit'?1:6,cardIndex:0,resume:'await-roll',choiceError:null}
else if(scenario==='credit-result'){game.credit[1]!.used=0;game.credit[1]!.available=100000;game.interaction={kind:'notice',playerId,resume:'bank',notice:{kind:'bank',message:'credit-granted',financeEntry:{kind:'credit-granted',playerId,creditAvailableDelta:100000}}}}
else if(scenario==='bank-result')game.interaction={kind:'notice',playerId,resume:'bank',notice:{kind:'bank',message:'bank-deposit',financeEntry:{kind:'bank-deposit',playerId,cashDelta:-250,depositDelta:250}}}
else game.interaction={kind:'notice',playerId,resume:'end-turn',notice:{kind:'world',message:'god-encountered',eventKind:'god-encountered',npcId:2,amount:16053}}
const [rawActivity,rawInteraction]=await Promise.all([fetch('/assets/activities/manifest.json').then(r=>r.json()),fetch('/assets/interactions/manifest.json').then(r=>r.json())])
const activityAssets=mapAssetProfile(parseActivityAssets(rawActivity),profile), assets=mapAssetProfile(parseInteractionAssets(rawInteraction),profile)
createApp({setup(){const event=ref('');return()=>h('main',{class:'original-ui'},[
 h('header',{class:'gallery-header'},[h('h1',`对局交互检查 · ${scenario}`),h('output',{'data-testid':'event'},event.value)]),
 h('div',{class:'board-surface'},[h(InteractionPanel,{game,paused:query.has('paused'),assetProfile:profile,cardAssets:assets.cards,luckAssets:assets.luck,activityAssets,
 onBankOperation:(operation:string,amount:number)=>{event.value=`${operation}:${amount}`},onTradeStock:(side:string,id:number,shares:number)=>{event.value=`${side}:${id}:${shares}`},onChoose:(choice:unknown)=>{event.value=JSON.stringify(choice)},onAcknowledge:()=>{event.value='continue'},onAssetError:(e:Error)=>{event.value=e.message},onConfirm:()=>{event.value='confirm'},onBuy:(slot:number)=>{event.value=`buy:${slot}`},onSell:(slot:number)=>{event.value=`sell:${slot}`}})]),
 h('footer','手牌区边界：主要操作必须完整出现在上方'),])}}).mount('#app')
const style=document.createElement('style');style.textContent='html,body,#app{height:100%;margin:0;font:14px system-ui}*{box-sizing:border-box}main{height:100dvh;display:flex;flex-direction:column;background:#c4eaff}.gallery-header{height:70px;padding:12px;flex:none}h1{font-size:16px;margin:0}output{color:#245a83}.board-surface{flex:1;min-height:0;position:relative;container-type:size;background:linear-gradient(135deg,#8cd1ec,#c5eaff)}main>footer{height:160px;flex:none;padding:20px;background:#57baf5}';document.head.append(style)
