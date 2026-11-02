import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import { createViteConfig } from '../vite.config'

test('modern production output keeps runtime assets and excludes artwork working files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'star-cat-build-'))
  try {
    const publicDir = path.join(root, 'public/modern')
    for (const file of ['assets/character.png', 'assets-hd/character.webp', 'hd-map/map.webp',
      'hd-static/card.webp', 'hd-characters/juanmao-24/head.png', 'hd-masters/review.png', 'hd-static-masters/card.png', 'hd-review/index.html']) {
      const target = path.join(publicDir, file)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, file)
    }
    const input = path.join(root, 'modern.html')
    await writeFile(input, '<!doctype html><title>Build fixture</title>')
    const config = createViteConfig('modern')
    const outDir = path.join(root, 'custom-output')
    await build({ ...config, root, configFile: false, publicDir, logLevel: 'silent',
      build: { ...config.build, outDir, rolldownOptions: { input } } })
    expect((await readdir(outDir)).sort()).toEqual(['assets', 'assets-hd', 'hd-characters', 'hd-map', 'hd-static', 'modern.html'])
    expect(await readFile(path.join(outDir,'hd-characters/juanmao-24/head.png'),'utf8')).toBe('hd-characters/juanmao-24/head.png')
    expect(await readFile(path.join(outDir, 'assets/character.png'), 'utf8')).toBe('assets/character.png')
    expect(await readFile(path.join(outDir, 'assets-hd/character.webp'), 'utf8')).toBe('assets-hd/character.webp')
    expect(await readFile(path.join(outDir, 'hd-map/map.webp'), 'utf8')).toBe('hd-map/map.webp')
    expect(await readFile(path.join(outDir, 'hd-static/card.webp'), 'utf8')).toBe('hd-static/card.webp')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('original production output excludes modern assets and review materials', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'star-cat-original-build-'))
  try {
    const publicDir = path.join(root, 'public')
    for (const file of ['original/play.swf', 'hd-assets/play.swf', 'ruffle/ruffle.js',
      'modern/hd-masters/master.png', 'hd-review/index.html']) {
      const target = path.join(publicDir, file)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, file)
    }
    const input = path.join(root, 'index.html')
    await writeFile(input, '<!doctype html><title>Original build fixture</title>')
    const config = createViteConfig('production')
    const outDir = path.join(root, 'output')
    await build({ ...config, root, configFile: false, publicDir, logLevel: 'silent',
      build: { ...config.build, outDir, rolldownOptions: { input } } })
    expect((await readdir(outDir)).sort()).toEqual(['hd-assets', 'index.html', 'original', 'ruffle'])
    expect(await readFile(path.join(outDir, 'original/play.swf'), 'utf8')).toBe('original/play.swf')
    expect(await readFile(path.join(outDir, 'hd-assets/play.swf'), 'utf8')).toBe('hd-assets/play.swf')
    expect(await readFile(path.join(outDir, 'ruffle/ruffle.js'), 'utf8')).toBe('ruffle/ruffle.js')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('modern original-profile build tolerates intentionally omitted HD runtime assets', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'star-cat-no-hd-cache-'))
  try {
    const publicDir = path.join(root, 'public/modern')
    for (const directory of ['assets', 'hd-map', 'hd-static', 'hd-characters']) {
      await mkdir(path.join(publicDir, directory), { recursive: true })
      await writeFile(path.join(publicDir, directory, 'image.png'), 'runtime image')
    }
    const input = path.join(root, 'modern.html')
    await writeFile(input, '<!doctype html><title>Original-profile build</title>')
    const config = createViteConfig('modern')
    const outDir = path.join(root, 'output')
    await build({ ...config, root, configFile: false, publicDir, logLevel: 'silent',
      build: { ...config.build, outDir, rolldownOptions: { input } } })
    expect((await readdir(outDir)).sort()).toEqual(['assets', 'hd-characters', 'hd-map', 'hd-static', 'modern.html'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
