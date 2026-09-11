import type { CharacterDef } from '@/core/types'

/**
 * 程序化生成星座猫头像。
 *
 * 全部由角色数据（fur / furLight / color）驱动，**不包含任何原版素材**，
 * 想换画风只改这一个文件。
 */
export function catSvg(c: CharacterDef): string {
  const ink = '#2b2140'
  const parts: string[] = []

  parts.push('<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">')
  parts.push(`<g stroke="${ink}" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round">`)

  // 耳朵
  parts.push(`<path d="M14.5 24 L12.5 6.5 L28 15.5 Z" fill="${c.fur}"/>`)
  parts.push(`<path d="M49.5 24 L51.5 6.5 L36 15.5 Z" fill="${c.fur}"/>`)
  parts.push(`<path d="M16.8 20.5 L15.8 11.6 L24 16.6 Z" fill="${c.tint}" stroke="none"/>`)
  parts.push(`<path d="M47.2 20.5 L48.2 11.6 L40 16.6 Z" fill="${c.tint}" stroke="none"/>`)

  // 头
  parts.push(`<ellipse cx="32" cy="35" rx="21" ry="18.5" fill="${c.fur}"/>`)

  // 口鼻
  parts.push(`<ellipse cx="32" cy="41.5" rx="11.5" ry="8" fill="${c.furLight}" stroke="none" opacity=".9"/>`)

  // 眼睛
  parts.push(`<ellipse cx="24.2" cy="33.4" rx="4.3" ry="5.1" fill="${ink}" stroke="none"/>`)
  parts.push(`<ellipse cx="39.8" cy="33.4" rx="4.3" ry="5.1" fill="${ink}" stroke="none"/>`)
  parts.push(`<circle cx="25.8" cy="31.4" r="1.7" fill="#fff" stroke="none"/>`)
  parts.push(`<circle cx="41.4" cy="31.4" r="1.7" fill="#fff" stroke="none"/>`)
  parts.push(`<circle cx="22.9" cy="35.6" r="0.9" fill="#fff" stroke="none" opacity=".7"/>`)
  parts.push(`<circle cx="38.5" cy="35.6" r="0.9" fill="#fff" stroke="none" opacity=".7"/>`)

  // 鼻子与嘴
  parts.push(`<path d="M32 38.6 l-2.7 2.3 h5.4 z" fill="#ff8fa3" stroke="none"/>`)
  parts.push(`<path d="M32 41.2 v2.1" fill="none" stroke-width="1.7"/>`)
  parts.push(`<path d="M32 43.3 q-2.8 2.4 -5.2 0.2" fill="none" stroke-width="1.7"/>`)
  parts.push(`<path d="M32 43.3 q2.8 2.4 5.2 0.2" fill="none" stroke-width="1.7"/>`)

  // 胡须
  parts.push(`<g stroke-width="1.5" opacity=".45" fill="none">`)
  parts.push(`<path d="M16.5 37.5 L8 35.5"/><path d="M16.5 41.5 L8.5 42.5"/>`)
  parts.push(`<path d="M47.5 37.5 L56 35.5"/><path d="M47.5 41.5 L55.5 42.5"/>`)
  parts.push(`</g>`)

  // 星座标记：每只猫头顶一个小符号，用主色
  parts.push(`<circle cx="32" cy="7" r="4.6" fill="${c.color}" stroke="${ink}" stroke-width="2"/>`)
  parts.push(`<path d="M32 3.6 l1.3 2.6 2.8 .4 -2 2 .5 2.8 -2.6 -1.4 -2.6 1.4 .5 -2.8 -2 -2 2.8 -.4 Z" fill="#fff" stroke="none"/>`)

  parts.push('</g></svg>')
  return parts.join('')
}
