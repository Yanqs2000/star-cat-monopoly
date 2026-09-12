import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export const createViteConfig = (mode: string) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  publicDir: mode === 'modern' ? 'public/modern' : 'public',
  build: mode === 'modern' ? { outDir: 'dist-modern', rolldownOptions: { input: fileURLToPath(new URL('./modern.html', import.meta.url)) } } : {},
  server: {
    port: mode === 'modern' ? 5184 : 5173,
    open: false,
  },
})
export default defineConfig(({ mode }) => createViteConfig(mode))
