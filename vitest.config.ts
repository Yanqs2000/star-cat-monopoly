import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

/**
 * 核心规则层（src/core）是纯 TypeScript，不依赖 DOM，
 * 因此单测跑在 node 环境下即可；组件测试单独用 jsdom。
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['tests/**/*.spec.ts'],
      exclude: ['tests/e2e/**'],
      environment: 'node',
      // 整局模拟测试会跑十几局完整对局，默认 5s 不够
      testTimeout: 60_000,
    },
  }),
)
