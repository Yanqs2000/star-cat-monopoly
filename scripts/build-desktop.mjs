import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const pkg = JSON.parse(await readFile(path.join(root, 'desktop/package.json'), 'utf8'))
await build({
  entryPoints: [path.join(root, 'desktop/src/main.ts')],
  outfile: path.join(root, 'desktop/dist/main.cjs'),
  bundle: true, platform: 'node', format: 'cjs', target: 'node24',
  external: ['electron', ...Object.keys(pkg.dependencies)],
  sourcemap: false,
})
