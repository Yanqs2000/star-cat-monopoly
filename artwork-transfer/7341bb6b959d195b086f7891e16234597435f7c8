import { expect, test } from '@playwright/test'
import anchors from '../../src/modern/data/property-marker-anchors.json' with { type: 'json' }

test('高清43号地标识底部对齐实测角桩后方落点，所有56块均已购', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/tests/fixtures/modern-property-corners.html')
  await expect(page.locator('#status')).toContainText('全部56块已购')
  const actual = await page.evaluate(async () => {
    const fixture = (window as any).cornerFixture
    const props = fixture.scene.getPortalDecorations().slice(0, 56)
    const frame = props[21].clip.frames[0]
    const image = await createImageBitmap(await fetch('/' + frame.url).then(r => r.blob()))
    const canvas = new OffscreenCanvas(image.width, image.height), ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    const data = ctx.getImageData(0, 0, image.width, image.height).data
    let minX = image.width, maxX = 0, maxY = 0
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (data[(y * image.width + x) * 4 + 3]! >= 128) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x + 1); maxY = Math.max(maxY, y + 1)
    }
    return { owned: Object.values(fixture.state.properties).filter((p: any) => p.ownerId !== null).length,
      x: frame.offsetX + (minX + maxX) / 2 / image.width * frame.width,
      y: frame.offsetY + maxY / image.height * frame.height }
  })
  expect(actual.owned).toBe(56)
  expect(actual.x).toBeCloseTo(21, 0)
  expect(actual.y).toBeCloseTo(52, 0)
})

for (const profile of ['hd', 'original'] as const) {
  test(`${profile} 实际地产图层中56块地的四种玩家标识落点均正确`, async ({ page }) => {
    test.setTimeout(120_000)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('response', response => { if (response.status() >= 400) errors.push(response.url()) })
    await page.goto(`/tests/fixtures/modern-property-corners.html?profile=${profile}`)
    await expect(page).toHaveTitle(/星猫大富翁/)
    await expect(page.locator('#status')).toContainText('全部56块已购')
    const points = await page.evaluate(async () => {
      const fixture = (window as any).cornerFixture
      const masks = new Map<string, { width: number; height: number; centerX: number; bottomY: number }>()
      const results = []
      for (const ownerId of [1, 2, 3, 4]) {
        for (const property of Object.values(fixture.state.properties) as any[]) property.ownerId = ownerId
        fixture.scene.setProperties(fixture.state.properties)
        const overlays = fixture.scene.getPortalDecorations().slice(0, 56)
        for (const [index, overlay] of overlays.entries()) {
          const frame = overlay.clip.frames[0]
          if (!masks.has(frame.url)) {
            const image = await createImageBitmap(await fetch('/' + frame.url).then(r => r.blob()))
            const canvas = new OffscreenCanvas(image.width, image.height), ctx = canvas.getContext('2d')!
            ctx.drawImage(image, 0, 0)
            const data = ctx.getImageData(0, 0, image.width, image.height).data
            let minX = image.width, maxX = 0, maxY = 0
            for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (data[(y * image.width + x) * 4 + 3]! >= 128) {
              minX = Math.min(minX, x); maxX = Math.max(maxX, x + 1); maxY = Math.max(maxY, y + 1)
            }
            masks.set(frame.url, { width: image.width, height: image.height, centerX: (minX + maxX) / 2, bottomY: maxY })
            image.close()
          }
          const mask = masks.get(frame.url)!
          results.push({ id: Number(Object.keys(fixture.state.properties)[index]), ownerId,
            x: frame.offsetX + mask.centerX / mask.width * frame.width,
            y: frame.offsetY + mask.bottomY / mask.height * frame.height })
        }
      }
      return results
    })
    expect(points).toHaveLength(224)
    const corners: Record<string, number[]> = anchors.corners
    for (const point of points) {
      expect(point.x, `${profile} #${point.id} P${point.ownerId} x`).toBeCloseTo(profile === 'hd' ? corners[point.id]![0]! : 29, 0)
      expect(point.y, `${profile} #${point.id} P${point.ownerId} y`).toBeCloseTo(profile === 'hd' ? corners[point.id]![1]! - 10 : 53.35, 0)
    }
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('角落验收场景按正式入口的像素密度绘制真实黄色地面', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 720 })
  await page.goto('/tests/fixtures/modern-property-corners.html')
  await expect(page.locator('#status')).toContainText('全部56块已购')
  await page.selectOption('#parcel', '43')
  const sample = async () => {
    const png = await page.locator('#board canvas').screenshot()
    return page.evaluate(async data => {
      const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type: 'image/png' }))
      const c = new OffscreenCanvas(bitmap.width, bitmap.height), ctx = c.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0); bitmap.close()
      const [r, g, b] = ctx.getImageData(400, 300, 1, 1).data
      // Surveyed interior point on plot43 is yellow, never gray road or green lawn.
      return r! > 190 && g! > 130 && b! < 120
    }, png.toString('base64'))
  }
  await expect.poll(sample, { timeout: 5000 }).toBe(true)
})
