import {build} from 'esbuild'
import {readFile,writeFile} from 'node:fs/promises'
const outfile='public/hd-review/characters-25/next/runtime.js'
await build({entryPoints:['src/modern/features/characters/characters-25-next-review.ts'],bundle:true,format:'esm',target:'es2022',outfile,minify:true})
await writeFile(outfile,(await readFile(outfile,'utf8')).replace(/[\t ]+$/gm,''))
