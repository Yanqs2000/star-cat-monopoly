import type { CharacterDef, CharacterId } from '../types'

/**
 * 12 星座星猫。
 *
 * ⚠️ 关于 IP：角色名沿用原版攻略里出现的名字，方便你对照原游戏；
 * 但**美术是原创的**（自绘 SVG 猫），没有复制《快乐星猫》的任何素材。
 * 想换成你自己的角色，改这个文件即可，其余代码全部数据驱动。
 *
 * 技能是「大富翁玩法」的技能（原版动画里的战斗招式没法直接搬），
 * 每个技能都能用引擎现有的状态表达。
 */
export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: 'juanmao',
    name: '卷毛',
    zodiac: '白羊座',
    trait: 'aggressive',
    color: '#f76707',
    tint: '#ffe8cc',
    fur: '#ffa94d',
    furLight: '#ffd8a8',
    skill: { name: '冲劲', icon: '💨', cooldown: 4, desc: '本回合移动额外 +2 格' },
  },
  {
    id: 'aniu',
    name: '阿牛',
    zodiac: '金牛座',
    trait: 'steady',
    color: '#a97400',
    tint: '#fff3bf',
    fur: '#e0b040',
    furLight: '#ffe8a8',
    skill: { name: '金牛护体', icon: '🛡️', cooldown: 6, desc: '接下来 3 回合过路费减半' },
  },
  {
    id: 'jijimimi',
    name: '吉吉米米',
    zodiac: '双子座',
    trait: 'gambler',
    color: '#7048e8',
    tint: '#e5dbff',
    fur: '#9775fa',
    furLight: '#d0bfff',
    skill: { name: '双声道', icon: '🗣️', cooldown: 5, desc: '立刻获得 2 张卡片' },
  },
  {
    id: 'jiajia',
    name: '佳佳',
    zodiac: '巨蟹座',
    trait: 'cautious',
    color: '#e64980',
    tint: '#ffdeeb',
    fur: '#f783ac',
    furLight: '#fcc2d7',
    skill: { name: '治愈泡泡', icon: '🫧', cooldown: 5, desc: '立刻获得现金 = 存款的 10%' },
  },
  {
    id: 'dapai',
    name: '大牌',
    zodiac: '狮子座',
    trait: 'aggressive',
    color: '#e8590c',
    tint: '#ffe3e3',
    fur: '#ff922b',
    furLight: '#ffc078',
    skill: { name: '狮子咆哮', icon: '🦁', cooldown: 6, desc: '随机一位对手向你支付 15,000' },
  },
  {
    id: 'weiwei',
    name: '薇薇',
    zodiac: '处女座',
    trait: 'cautious',
    color: '#0ca678',
    tint: '#c3fae8',
    fur: '#63e6be',
    furLight: '#c3fae8',
    skill: { name: '绝对净化', icon: '✨', cooldown: 5, desc: '驱散身上的坏神明，并获得 1 张卡片' },
  },
  {
    id: 'shuaige',
    name: '帅戈',
    zodiac: '天秤座',
    trait: 'steady',
    color: '#1c7ed6',
    tint: '#d0ebff',
    fur: '#74c0fc',
    furLight: '#d0ebff',
    skill: { name: '天平', icon: '⚖️', cooldown: 6, desc: '把现金与存款拉平（总额不变）' },
  },
  {
    id: 'dawei',
    name: '大尾',
    zodiac: '天蝎座',
    trait: 'aggressive',
    color: '#5f3dc4',
    tint: '#e5dbff',
    fur: '#845ef7',
    furLight: '#d0bfff',
    skill: { name: '毒尾', icon: '🦂', cooldown: 6, desc: '随机一位对手跳过下一回合' },
  },
  {
    id: 'afei',
    name: '阿飞',
    zodiac: '射手座',
    trait: 'gambler',
    color: '#2f9e44',
    tint: '#d3f9d8',
    fur: '#69db7c',
    furLight: '#d3f9d8',
    skill: { name: '流星', icon: '🌠', cooldown: 5, desc: '本回合可以再掷一次骰子' },
  },
  {
    id: 'ajie',
    name: '阿杰',
    zodiac: '摩羯座',
    trait: 'steady',
    color: '#495057',
    tint: '#e9ecef',
    fur: '#adb5bd',
    furLight: '#dee2e6',
    skill: { name: '推演', icon: '🧮', cooldown: 4, desc: '本回合骰子点数 +3' },
  },
  {
    id: 'guaika',
    name: '怪卡',
    zodiac: '水瓶座',
    trait: 'gambler',
    color: '#0b7285',
    tint: '#c5f6fa',
    fur: '#3bc9db',
    furLight: '#c5f6fa',
    skill: { name: '发明', icon: '🔧', cooldown: 5, desc: '立刻获得 20,000 ~ 60,000 随机现金' },
  },
  {
    id: 'nini',
    name: '妮妮',
    zodiac: '双鱼座',
    trait: 'cautious',
    color: '#d6336c',
    tint: '#ffdeeb',
    fur: '#f06595',
    furLight: '#fcc2d7',
    skill: { name: '梦幻之舞', icon: '🩰', cooldown: 5, desc: '立刻获得 3 张奖券和 10,000 现金' },
  },
]

export const CHARACTER_BY_ID: Readonly<Record<CharacterId, CharacterDef>> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
)

export function getCharacter(id: CharacterId): CharacterDef {
  const c = CHARACTER_BY_ID[id]
  if (!c) throw new Error(`未知角色: ${id}`)
  return c
}
