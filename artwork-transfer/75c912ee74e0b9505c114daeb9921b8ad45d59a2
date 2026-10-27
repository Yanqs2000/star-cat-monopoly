import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
it('19原MP3清单锁定来源、完整覆盖曲名与非空二进制，不引入空WAV',()=>{
 const root=resolve(import.meta.dirname,'../..'),manifest=JSON.parse(readFileSync(resolve(root,'public/modern/assets/audio/manifest.json'),'utf8'))
 expect(manifest.sourceSha256).toBe(createHash('sha256').update(readFileSync(resolve(root,'public/original/play.swf'))).digest('hex'))
 const expected=['gamemusic','monthmusic','startmusic1','startmusic2',...[1,2,3,4,5].map(i=>`backmusic${i}`),...Array.from({length:10},(_,i)=>`sn_${i+1}`)]
 expect(manifest.sounds.map((s:{id:string})=>s.id).sort()).toEqual(expected.sort())
 for(const item of manifest.sounds){const bytes=readFileSync(resolve(root,'public/modern',item.url));expect(bytes.length).toBe(item.bytes);expect(bytes.length).toBeGreaterThan(100);expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256)}
})
