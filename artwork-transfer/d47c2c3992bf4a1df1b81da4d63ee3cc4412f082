import { defineConfig } from '@playwright/test'
import original from './playwright.config'

const externalURL = process.env.PLAYWRIGHT_BASE_URL
export default defineConfig(original, {
  testMatch: '**/modern-*.spec.ts',
  testIgnore: [],
  outputDir: '/tmp/starcat-modern-e2e',
  use: { baseURL: externalURL ?? 'http://127.0.0.1:5184' },
  webServer: externalURL ? undefined : {
    command: 'npm run dev:modern -- --strictPort',
    url: 'http://127.0.0.1:5184/modern.html',
    reuseExistingServer: true,
  },
})
