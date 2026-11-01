import {expect,type Page} from '@playwright/test'

/** DOM diagnostics can update before WebGL presents its first terrain frame. */
export async function expectPresentedMap(page:Page){
 // At the fixed artwork-test viewport a uniform black map is only a few KB;
 // the actual detailed terrain is hundreds of KB. Check compositor pixels,
 // rather than reading WebGL's cleared presentation buffer with toDataURL.
 await expect.poll(async()=>(await page.locator('canvas').first().screenshot()).length,
  {timeout:15000,intervals:[50,100,200]}).toBeGreaterThan(50_000)
}
