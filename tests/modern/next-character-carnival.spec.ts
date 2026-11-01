import {it,expect} from 'vitest'
import {carnivalActorPresentation} from '../../src/modern/features/game/carnival-character-presentation'
import type {ActivityClip} from '../../src/modern/features/game/activity-assets'

it('interpolates the new Guaika and Weiwei rigs between the original 30Hz movement ticks',()=>{
 for(const id of [11,6]){
  const clip={id:`carnival-walk-${id}-right`,fps:120,frames:[{url:`hd-characters/characters-25/role-${String(id).padStart(2,'0')}/carnival-right-0.webp`}]}as ActivityClip
  expect(carnivalActorPresentation(clip,1,400,408,1000/60)).toEqual({frame:3,x:404})
  const edge=carnivalActorPresentation(clip,1,400,408,1000/30-1e-7)
  expect(edge.x).toBeCloseTo(carnivalActorPresentation(clip,2,408,416,0).x,5)
 }
})
