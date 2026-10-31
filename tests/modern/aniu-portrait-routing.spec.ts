// @vitest-environment jsdom
import{it,expect}from'vitest'
import{mount}from'@vue/test-utils'
import{createGame}from'../../src/modern/features/game/setup'
import{profileAssetUrl}from'../../src/modern/features/assets/profiles'
import{character25ThumbnailUrl}from'../../src/modern/features/characters/characters-25-registry'
import MonthlySettlement from'../../src/modern/features/game/MonthlySettlement.vue'
import EndgamePanel from'../../src/modern/features/game/EndgamePanel.vue'
import PlayerWallet from'../../src/modern/features/game/PlayerWallet.vue'
import GameReferencePanel from'../../src/modern/features/game/GameReferencePanel.vue'
import GamePanel from'../../src/modern/features/game/GamePanel.vue'

it('uses the same new A-Niu in selection, loading, wallet, monthly, standings, outcome and player list',()=>{
 const game=createGame([2,1,3,4],1);game.players[0]!.deposit=999999
 const monthly=mount(MonthlySettlement,{props:{game,entries:[],paused:false,assetProfile:'hd'}})
 expect(monthly.get('[data-testid="monthly-champion"] img').attributes('src')).toContain('/characters-25/role-02/')
 monthly.unmount()
 const wallet=mount(PlayerWallet,{props:{player:game.players[0]!,assetProfile:'hd'}})
 expect(wallet.get('.wallet-owner img').attributes('src')).toContain('/characters-25/role-02/');wallet.unmount()
 const standings=mount(GameReferencePanel,{props:{game,tab:'assets',assetProfile:'hd'}})
 expect(standings.findAll('img').some(i=>i.attributes('src')?.includes('/characters-25/role-02/'))).toBe(true);standings.unmount()
 const panel=mount(GamePanel,{props:{game,paused:false,speed:1,history:[],assetProfile:'hd'}})
 expect(panel.get('.token img').attributes('src')).toContain('/characters-25/role-02/');panel.unmount()
 game.phase='ended';game.outcome={kind:'victory',winnerId:1}
 const end=mount(EndgamePanel,{props:{game,paused:false,assetProfile:'hd'}})
 expect(end.get('[data-testid="endgame-actor-art"]').attributes('src')).toContain('/characters-25/role-02/');end.unmount()
 for(const source of['assets/activities/face-2/1.png','assets/activities/head-2/1.png','assets/monthly/champions/2.png']){
  expect(profileAssetUrl(source,'hd')).toContain('/characters-25/role-02/')
  expect(profileAssetUrl(source,'original')).toBe(source)
 }
 expect(character25ThumbnailUrl(2,'hd')).toContain('/characters-25/role-02/')
 expect(character25ThumbnailUrl(2,'original')).toBeUndefined()
 expect(profileAssetUrl('assets/characters/2/walk/down-right/1.png','hd')).toBe('assets-hd/characters/2/walk/down-right/1.webp')
 expect(profileAssetUrl('assets/monthly/champions/1.png','hd')).toBe('assets/monthly/champions/1.png')
})
