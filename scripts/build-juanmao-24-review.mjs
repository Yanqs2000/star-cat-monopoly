import { build } from 'esbuild'
import {readFile,writeFile}from'node:fs/promises'
await build({entryPoints:['src/modern/features/characters/juanmao-24-review.ts'],bundle:true,format:'esm',target:'es2022',outfile:'public/hd-review/character-24/runtime.js',minify:true})
const output='public/hd-review/character-24/runtime.js'
await writeFile(output,(await readFile(output,'utf8')).replace(/[ \t]+$/gm,''))
