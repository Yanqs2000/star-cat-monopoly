import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, truncateSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { prepareReleaseAssets } from '../../desktop/src/release'
const dirs: string[] = [], version = '1.0.0', sha = 'a'.repeat(40)
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'starcat-release-')); dirs.push(root)
  for (const [id, platform, arch, suffix] of [['mac-arm64', 'darwin', 'arm64', 'mac-arm64.dmg']]) {
    const dir = path.join(root, id!); mkdirSync(dir)
    writeFileSync(path.join(dir, `StarCatMonopoly-${version}-${suffix}`), 'abc')
    writeFileSync(path.join(dir, 'installer.json'), JSON.stringify({ version, sourceCommit: sha, runtime: { platform, arch, packaged: true }, hdTextureCount: 1, hdTextureBytes: 3, installedVerified: true, overwritePreserved: true, removedAppPreservedSave: true, defaultProfile: 'hd', saveRestartPreserved: true, rollVerified: true, serverStopped: true, errors: [], failedResponses: [], consoleErrors: [] }))
  }
  return root
}
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
it('仅 Apple Silicon DMG 经过安装验证即可产生实际 SHA256 校验文件', async () => {
  const root = fixture(), result = await prepareReleaseAssets(root, version, sha)
  expect(result.assets).toHaveLength(1)
  expect(result.assets.map(a => a.sha256)).toEqual(Array(1).fill('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'))
  expect(readFileSync(result.checksumPath, 'utf8').trim().split('\n')).toHaveLength(1)
})
it('缺少 Apple Silicon DMG 则不能交付', async () => {
  const root = fixture(); rmSync(path.join(root, 'mac-arm64', `StarCatMonopoly-${version}-mac-arm64.dmg`))
  await expect(prepareReleaseAssets(root, version, sha)).rejects.toThrow(/缺少/)
})
it('来源提交不同的旧构建不能混入同一 Release', async () => {
  await expect(prepareReleaseAssets(fixture(), version, 'b'.repeat(40))).rejects.toThrow(/来源/)
})
it.each([false, 'false', 1])('非布尔成功标记 %s 不能代替真实安装验证', async installedVerified => {
  const root = fixture(), file = path.join(root, 'mac-arm64/installer.json'), report = JSON.parse(readFileSync(file, 'utf8'))
  report.installedVerified = installedVerified; writeFileSync(file, JSON.stringify(report))
  await expect(prepareReleaseAssets(root, version, sha)).rejects.toThrow(/安装验证/)
})
it('达到 GitHub 单附件 2 GiB 上限时在读取大文件之前拒绝', async () => {
  const root = fixture(); truncateSync(path.join(root, 'mac-arm64', `StarCatMonopoly-${version}-mac-arm64.dmg`), 2 * 1024 ** 3)
  await expect(prepareReleaseAssets(root, version, sha)).rejects.toThrow(/2 GiB/)
})
