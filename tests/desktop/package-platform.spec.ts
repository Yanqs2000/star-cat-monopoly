import { expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { Arch } from 'electron-builder'
const beforePack = createRequire(import.meta.url)('../../scripts/before-desktop-pack.cjs') as (context: { electronPlatformName: string; arch: number }) => Promise<void>
const hostArch = Arch[process.arch as 'x64' | 'arm64']
it('本机架构允许复用已校验的 Electron 分发目录', async () => {
  await expect(beforePack({ electronPlatformName: process.platform, arch: hostArch })).resolves.toBeUndefined()
})
it('拒绝把本机 Electron 错标为另一个系统或 CPU 架构', async () => {
  await expect(beforePack({ electronPlatformName: process.platform === 'win32' ? 'darwin' : 'win32', arch: hostArch })).rejects.toThrow(/native/)
  await expect(beforePack({ electronPlatformName: process.platform, arch: process.arch === 'arm64' ? Arch.x64 : Arch.arm64 })).rejects.toThrow(/native/)
})
