import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('source downloads include the HD profile, manifest and every verified runtime texture', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const base = 'public/modern/assets-hd/'
  const hasGit = existsSync(path.join(root, '.git'))
  const entries = hasGit ? execFileSync('git', ['ls-files', '--stage', '-z', '--', base], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  }).split('\0').filter(Boolean) : []
  const tracked = new Map(entries.map(entry => {
    const [metadata, name] = entry.split('\t')
    return [name!, metadata!.split(' ')[1]!] as const
  }))
  expect(existsSync(path.join(root, base, 'hd-profile.json'))).toBe(true)
  if (hasGit) {
    expect(tracked.has(base + 'hd-profile.json'), 'a fresh download must contain the default HD profile').toBe(true)
    expect(tracked.has(base + 'hd-manifest.json')).toBe(true)
  }
  function included(relative: string): Buffer {
    const filename = path.resolve(root, relative)
    expect(filename.startsWith(path.resolve(root, base) + path.sep)).toBe(true)
    const bytes = readFileSync(filename)
    const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
    if (hasGit) expect(tracked.get(relative), `the downloaded Git blob must match ${relative}`).toBe(blob)
    return bytes
  }
  const profile = JSON.parse(included(base + 'hd-profile.json').toString())
  const manifestBytes = included(base + 'hd-manifest.json')
  expect(createHash('sha256').update(manifestBytes).digest('hex')).toBe(profile.manifestSha256)
  const manifest = JSON.parse(manifestBytes.toString()) as { files: Array<{ path: string; outputSha256: string }> }
  expect(manifest.files.length).toBe(profile.assetCount)
  expect(profile.sourceAssetCount).toBe(profile.assetCount)
  let totalBytes = 0
  for (const entry of manifest.files) {
    expect(entry.path.startsWith('assets-hd/')).toBe(true)
    const bytes = included('public/modern/' + entry.path)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.outputSha256)
    totalBytes += bytes.length
  }
  expect(totalBytes).toBe(profile.totalBytes)
}, 30000)
