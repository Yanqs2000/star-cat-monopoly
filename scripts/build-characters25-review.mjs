import{build}from'esbuild'
import{readFile,writeFile}from'node:fs/promises'
await build({entryPoints:['src/modern/features/characters/characters-25-review.ts'],bundle:true,format:'esm',target:'es2022',outfile:'public/hd-review/characters-25/runtime.js',minify:true})
// Bundled GLSL retains trailing spaces; preserve tokens and line breaks.
const output='public/hd-review/characters-25/runtime.js'
await writeFile(output,(await readFile(output,'utf8')).replace(/[\t ]+$/gm,''))
