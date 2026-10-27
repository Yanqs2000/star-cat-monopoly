import type { InjectionKey, Ref } from 'vue'
import type { PreparedAnimations } from './animation-preload'
export const animationFramesKey:InjectionKey<Ref<PreparedAnimations|undefined>>=Symbol('prepared-game-animations')
