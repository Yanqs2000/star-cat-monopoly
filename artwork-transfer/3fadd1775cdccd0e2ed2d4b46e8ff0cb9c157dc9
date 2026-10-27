import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { settleBankruptcy, getOutcome, applyPendingControl } from '../../src/modern/features/game/lifecycle'
import { nextTurn } from '../../src/modern/features/game/turns'
import { applyDirectCard } from '../../src/modern/features/game/direct-cards'
import { applyWorldCard, finishNpcEncounter } from '../../src/modern/features/game/world-cards'
import { buildPlayerPoses } from '../../src/modern/features/game/game-visuals'

describe('3D原版清算与终局', () => {
  it('淘汰者实例删除后，其原道路格可以重新放置NPC',()=>{
    const game=createGame([1,2,3,4],1)
    game.eliminatedPlayerIds=[2];game.players[1]!.position={column:6,row:32}
    game.world.markers={53:14};game.rngState=1972
    expect(finishNpcEncounter(game,14,53).snapshot.world.markers[1]).toBe(14)
  })
  it('淘汰投影明确删除实例，不能沿用住院时保留hurt动画的隐藏策略',()=>{
    const game=createGame([1,2,3,4],1);game.eliminatedPlayerIds=[1];game.world.statuses[1]!.state=9
    expect(buildPlayerPoses(game)[0]).toMatchObject({visible:false,eliminated:true})
  })
  it('清算后的角色不能再被均富/换卡选中或受飞弹影响',()=>{
    const game=createGame([1,2,3,4],1)
    game.eliminatedPlayerIds=[2];game.players[1]!.position={column:6,row:32};game.players[0]!.position={column:34,row:8}
    game.inventories[1]=[33,9]
    expect(applyDirectCard(game,1,0,{kind:'cell',position:{column:6,row:32}}).status).toBe('invalid-target')
    const result=applyWorldCard(game,1,1,{kind:'cell',position:{column:6,row:32}})
    expect(result.event!.affectedPlayerIds).not.toContain(2)
    expect(result.snapshot.eliminatedPlayerIds).toEqual([2])
  })
  it('清算复现原probe：股池封顶溢出、并列董事按座位先到、房屋等级保留', () => {
    const game = createGame([1,2,3,4], 1)
    game.players[0]!.cash=0; game.players[0]!.deposit=-1
    const company=game.finance.stocks[1]!
    company.offerShares=2000; company.poolBandValue=1000
    company.holdings[1]={shares:3100,averageCost:10}
    company.holdings[2]={shares:100,averageCost:10};company.holdings[3]={shares:100,averageCost:10}
    game.finance.stocks[2]!.holdings[1]={shares:77,averageCost:10}; game.finance.stocks[2]!.kind=1
    game.finance.stocks[2]!.poolBandValue=1000
    game.finance.stocks[13]!.offerShares=2000;game.finance.stocks[13]!.holdings[1]={shares:99,averageCost:5}
    game.properties[1]={ownerId:1,level:2};game.credit[1]={score:100,used:55,available:99945};game.finance.loans[1]=200
    const result=settleBankruptcy(game,1)
    expect(result.eliminatedPlayerIds).toEqual([1])
    expect(result.players[0]).toMatchObject({cash:0,deposit:0})
    expect(result.properties[1]).toEqual({ownerId:null,level:2})
    expect(result.finance.stocks[1]).toMatchObject({ceoId:2,offerShares:5000,poolBandValue:1100,holdings:{1:{shares:0,averageCost:0}}})
    expect(result.finance.stocks[2]!.poolBandValue).toBe(1077)
    expect(result.finance.stocks[13]!.offerShares).toBe(2099)
    expect(result.inventories[1]).toEqual([]);expect(result.tickets[1]).toBe(0)
    expect(result.credit[1]).toEqual({score:0,used:0,available:0});expect(result.finance.loans[1]).toBe(0)
    expect(settleBankruptcy(result,1)).toBe(result)
    expect(game.players[0]!.deposit).toBe(-1)
  })
  it('现金加存款为正不清算，有地产股票但总余额零仍清算', () => {
    const game=createGame([1,2,3,4],1);game.players[0]!.cash=0;game.players[0]!.deposit=1
    expect(settleBankruptcy(game,1)).toBe(game)
    game.players[0]!.deposit=0
    expect(settleBankruptcy(game,1).eliminatedPlayerIds).toEqual([1])
  })
  it('无人继任清董事，股份均归还，受伤状态9不代表淘汰', () => {
    const game=createGame([1,2,3,4],1);game.players[0]!.cash=0;game.players[0]!.deposit=0
    game.world.statuses[2]!.state=9
    const result=settleBankruptcy(game,1)
    expect(result.finance.stocks[1]!.ceoId).toBeNull()
    expect(result.eliminatedPlayerIds).toEqual([1]);expect(getOutcome(result)).toBeNull()
  })
  it('原版无人类判负先于仅剩一人判赢，托管保留参赛资格', () => {
    const game=createGame([1],1)
    game.eliminatedPlayerIds=[1,3,4]
    expect(getOutcome(game)).toEqual({kind:'defeat',winnerId:null})
    game.players[1]!.controller='autoplay'
    expect(getOutcome(game)).toEqual({kind:'victory',winnerId:2})
    game.eliminatedPlayerIds=[3,4]
    expect(getOutcome(game)).toBeNull()
  })
  it('跳过两位淘汰者；越过数组尾部即算完整一轮，包括首位已经淘汰', () => {
    const game=createGame([1,2,3,4],1);game.phase='landed';game.eliminatedPlayerIds=[2,3]
    const a=nextTurn(game);expect(a.activePlayerIndex).toBe(3);expect(a.round).toBe(1)
    const b=nextTurn({...a,phase:'landed'});expect(b.activePlayerIndex).toBe(0);expect(b.round).toBe(2)
    game.activePlayerIndex=3;game.eliminatedPlayerIds=[1,3]
    expect(nextTurn(game)).toMatchObject({activePlayerIndex:1,round:2})
  })
  it('原控制切换将请求电脑记为托管2，原AI1不会误计成托管；淘汰者不可复活', () => {
    const game=createGame([1],1);game.eliminatedPlayerIds=[4]
    game.pendingControl={1:'autoplay',2:'human',4:'human'}
    const next=applyPendingControl(game)
    expect(next.players.map(p=>p.controller)).toEqual(['autoplay','human','ai','ai'])
    expect(next.pendingControl).toEqual({})
  })
})
