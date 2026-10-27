import { test, expect } from '@playwright/test'
for (const width of [1440, 1100]) for (const scenario of ['court-target', 'court-case', 'portal']) {
  test(`明确夹具${width}px桌面点击可见${scenario}区域匹配原选择`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`/tests/fixtures/modern-activity-layout.html?scenario=${scenario}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('原组件缩放热点测试夹具')
    await expect(page.getByTestId('layout-ready')).toHaveText('原素材已准备')
    const svg = page.getByTestId(scenario === 'portal' ? 'portal-original' : 'court-original')
    let point: { x: number; y: number }
    if (scenario === 'court-target') {
      const label = svg.locator('foreignObject').filter({ hasText: '吉吉&米米' })
      const box = await label.boundingBox(); expect(box).not.toBeNull()
      point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
    } else {
      const box = await svg.boundingBox(); expect(box).not.toBeNull()
      const source = scenario === 'portal' ? { x: 86.5, y: 268.5, width: 814, height: 614 } : { x: 396, y: 375, width: 824, height: 624 }
      point = { x: box!.x + source.x / source.width * box!.width, y: box!.y + source.y / source.height * box!.height }
    }
    await page.mouse.click(point.x, point.y)
    await expect(page.getByTestId('layout-choice')).toHaveText(scenario === 'court-target' ? '3' : scenario === 'court-case' ? '1' : '4')
  })
}
