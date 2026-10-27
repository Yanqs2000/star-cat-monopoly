import { fileURLToPath, URL } from 'node:url'
import { cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function runtimeAssets(mode: string): Plugin {
  let config: ResolvedConfig
  return {
    name: 'runtime-assets',
    apply: 'build',
    configResolved(resolved) { config = resolved },
    async writeBundle() {
      if (!config.publicDir) return
      const output = path.resolve(config.root, config.build.outDir)
      const directories = mode === 'modern'
        ? ['assets', 'assets-hd', 'hd-map', 'hd-static']
        : ['original', 'hd-assets', 'ruffle']
      for (const directory of directories) {
        const source = path.join(config.publicDir, directory)
        if (directory === 'assets-hd' && !existsSync(source)) continue
        await cp(source, path.join(output, directory), { recursive: true })
      }
    },
  }
}

export const createViteConfig = (mode: string) => ({
  plugins: [vue(), runtimeAssets(mode)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  publicDir: mode === 'modern' ? 'public/modern' : 'public',
  build: {
    copyPublicDir: false,
    ...(mode === 'modern' ? { outDir: 'dist-modern', rolldownOptions: { input: fileURLToPath(new URL('./modern.html', import.meta.url)) } } : {}),
  },
  preview: { proxy: mode === 'modern' ? { '/api': { target: 'http://127.0.0.1:4186', changeOrigin: true } } : undefined },
  server: {
    port: mode === 'modern' ? 5184 : 5173,
    open: false,
    proxy: mode === 'modern' ? { '/api': { target: 'http://127.0.0.1:4186', changeOrigin: true } } : undefined,
  },
})
export default defineConfig(({ mode }) => createViteConfig(mode))
