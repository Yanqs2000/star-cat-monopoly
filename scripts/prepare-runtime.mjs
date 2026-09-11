import { mkdir, readdir, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const source = path.join(root, 'node_modules/@ruffle-rs/ruffle')
const target = path.join(root, 'public/ruffle')
await mkdir(target, { recursive: true })
const names = (await readdir(source)).filter(name => /\.(js|wasm)$/.test(name) || name.startsWith('LICENSE_'))
if (!names.includes('ruffle.js') || !names.some(name => name.endsWith('.wasm'))) throw new Error('Ruffle 依赖不完整，请运行 npm ci')
await Promise.all(names.map(name => copyFile(path.join(source, name), path.join(target, name))))
console.log(`Ruffle 本地运行库已准备：${names.length} 个文件`)
