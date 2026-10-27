import { defineConfig } from '@playwright/test'
const externalURL = process.env.PLAYWRIGHT_BASE_URL
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/modern-*.spec.ts',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  workers: 1,
  outputDir: '/tmp/starcat-original-e2e',
  use: {
    baseURL: externalURL ?? 'http://127.0.0.1:5173',
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
    },
  },
  webServer: externalURL ? undefined : { command: 'npm run dev -- --host 127.0.0.1 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
})
