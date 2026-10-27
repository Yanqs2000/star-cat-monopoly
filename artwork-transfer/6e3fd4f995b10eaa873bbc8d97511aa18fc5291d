import { expect,it } from 'vitest'
import { beginLudo,placeWager,confirmWagers,advanceLudo,LUDO_CELLS } from '../../src/modern/features/game/ludo'
import { randomInt } from '../../src/modern/features/game/random'
it('入场0/9/10/105券及上限：至少一筹码，实际不足部分只扣现有券',()=>{
 for(const [tickets,chips,debit,left] of [[0,1,0,0],[9,1,9,0],[10,1,10,0],[105,10,100,5],[500,10,100,400]]) {
  const r=beginLudo(tickets!,1);expect(r.game.remaining).toBe(chips);expect(r.debit).toBe(debit);expect(tickets!-r.debit).toBe(left)
 }
})
it('36原区域、合并大小盘、零筹码/非法区域保持原状态',()=>{
 let g=beginLudo(20,1).game;expect(LUDO_CELLS).toHaveLength(36)
 expect(placeWager(g,36)).toBe(g);expect(placeWager(g,1.5)).toBe(g)
 g=placeWager(g,14);g=placeWager(g,26);expect(g.bets[7]).toBe(2);expect(g.remaining).toBe(0)
 expect(placeWager(g,0)).toBe(g)
})
function outcome(cell:number,faces:number[],remaining=7) {
 const g=confirmWagers(placeWager(beginLudo(105,1).game,cell))
 g.faces=faces as [number,number,number];g.remaining=remaining;g.frame=39
 const result=advanceLudo(g,1,false);return result
}
it('源赔付：豹子100/80，点数20/8/10，大小含豹子；只有中奖退未下筹码',()=>{
 expect(outcome(0,[1,1,1]).credit).toBe(1070)
 expect(outcome(1,[2,2,2]).credit).toBe(870)
 expect(outcome(6,[1,1,2]).credit).toBe(270)
 expect(outcome(30,[2,3,3]).credit).toBe(150)
 expect(outcome(31,[3,3,3]).credit).toBe(170)
 expect(outcome(7,[1,1,1]).credit).toBe(90)
 expect(outcome(9,[6,6,6]).credit).toBe(90)
 expect(outcome(0,[2,3,4]).credit).toBe(0)
})
it('骰子按原1/10/17/18/19帧消耗9次随机，40帧只结算一次，可序列化恢复',()=>{
 let g=confirmWagers(placeWager(beginLudo(100,3).game,7)),rng=beginLudo(100,3).rngState,credit=0
 let expected=rng;for(let i=0;i<9;i++)expected=randomInt(expected,6).nextState
 for(let i=0;i<40;i++){const r=advanceLudo(JSON.parse(JSON.stringify(g)),rng,false);g=r.game;rng=r.rngState;credit+=r.credit}
 expect(rng).toBe(expected);expect(g.stage).toBe('payout');expect(g.paid).toBe(true)
 for(let i=0;i<150;i++){const r=advanceLudo(g,rng,false);g=r.game;rng=r.rngState;expect(r.credit).toBe(0)}
 expect(g.stage).toBe('done');expect(credit).toBeGreaterThanOrEqual(0)
})
it('AI仅在30/40/50帧按大小、点数、豹子下注，70帧开骰；不足筹码不多抽随机',()=>{
 for(const tickets of [9,100]) {
  let g=beginLudo(tickets,1).game,rng=beginLudo(tickets,1).rngState
  for(let i=0;i<70;i++){const r=advanceLudo(g,rng,true);g=r.game;rng=r.rngState}
  expect(g.stage).toBe('rolling');expect(g.remaining).toBe(tickets===9?0:7);expect(g.bets.reduce((a,b)=>a+b,0)).toBe(tickets===9?1:3)
  let expected=beginLudo(tickets,1).rngState;for(const bound of tickets===9?[2]:[2,14,6])expected=randomInt(expected,bound).nextState
  expect(rng).toBe(expected)
 }
})
