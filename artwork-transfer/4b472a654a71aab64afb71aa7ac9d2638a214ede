import { describe, it, expect } from 'vitest'
import { gridToScene, sceneToGrid } from '../../src/modern/features/map/coordinates'

describe('原地图坐标', () => {
  it.each([
    [{ column: 6, row: 32 }, { x: 336, y: 1280 }],
    [{ column: 33, row: 7 }, { x: 1848, y: 280 }],
    [{ column: 20, row: 16 }, { x: 1120, y: 640 }],
  ])('保留原56×40网格步长：%o', (grid, scene) => {
    expect(gridToScene(grid)).toEqual(scene)
    expect(sceneToGrid(scene)).toEqual(grid)
  })
})
