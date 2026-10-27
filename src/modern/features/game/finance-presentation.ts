import type { FinanceEntry } from './finance-types'

export const financeLabels: Record<string, string> = {
  'bank-withdraw': '取款完成', 'bank-deposit': '存款完成', 'bank-borrow': '贷款完成',
  'bank-repay-loan': '还贷完成', 'bank-repay-credit': '刷卡额已缴纳',
  'company-distribution': '公司分配', 'credit-monthly-payment': '信用卡月还',
  'company-undistributed-profit': '未分配经营收入',
  'loan-monthly-payment': '贷款月还', 'deposit-interest': '存款利息',
  'credit-granted': '信用申请通过，信用卡已加入手牌',
  'stock-buy': '股票买入', 'stock-sell': '股票卖出',
  'company-subscribe': '公司认购', 'company-fee': '公司经营费',
}
export const monthlyQuotes = [
  '就凭你们，也想和我斗！', '赢得太轻松了……真没意思呢', '有没有像样一点的对手呀？',
  '你们，这回逊毙了哦……', '用脚趾头想都知道，赢的当然是我啦',
  '我的垄断时代到了哟，HOHOHOHOHO~~~', '感谢CCTV、MTV以及明日TV给我这个机会',
  '玩游戏，要先看懂规则滴', '俺是世界第一等！', '哈哈哈哈哈哈哈哈哈哈哈~~~',
  '不好意思，各位承让了', '赢钱要靠技术的，你们学着点',
  '哼哼哼哼哼，你们也有今天呀', '这个宝座，我八百年前就预定好了',
  '能力越大，责任越大，我太辛苦了',
] as const
export const actualChanges = (entry: FinanceEntry) => [
  ['现金', entry.cashDelta], ['存款', entry.depositDelta], ['贷款', entry.loanDelta],
  ['已用信用', entry.creditUsedDelta], ['可用信用', entry.creditAvailableDelta], ['持股', entry.sharesDelta],
].filter((item): item is [string, number] => typeof item[1] === 'number' && item[1] !== 0)
  .map(([label, amount]) => `${label} ${amount > 0 ? '+' : ''}${amount}`).join(' · ')
