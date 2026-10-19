import { describe, expect, it } from 'vitest'
import { profileAssetUrl, profileTextureResolution } from '../../src/modern/features/assets/profiles'

describe('generated static artwork overrides', () => {
  it('uses a newly generated building only in HD mode', () => {
    expect(profileAssetUrl('assets/companies/1.png', 'hd')).toBe('hd-static/companies/1.webp')
    expect(profileAssetUrl('assets/companies/1.png', 'original')).toBe('assets/companies/1.png')
    expect(profileTextureResolution('assets/companies/1.png', 'hd')).toBe(4)
    expect(profileTextureResolution('assets/companies/1.png', 'original')).toBe(1)
    expect(profileTextureResolution('assets/companies/2.png', 'hd')).toBe(2)
    expect(profileAssetUrl('assets/companies/1.png?v=2', 'hd')).toBe('hd-static/companies/1.webp?v=2')
  })

  it('uses the regenerated opaque company panel while preserving the original profile', () => {
    expect(profileAssetUrl('assets/companies/dialog.png', 'hd')).toBe('hd-static/companies/dialog.webp')
    expect(profileTextureResolution('assets/companies/dialog.png', 'hd')).toBe(3)
    expect(profileAssetUrl('assets/companies/dialog.png', 'original')).toBe('assets/companies/dialog.png')
  })

  it('keeps the existing completed buildings and character paths', () => {
    expect(profileAssetUrl('assets/companies/2.png', 'hd')).toBe('assets-hd/companies/2.webp')
    expect(profileAssetUrl('assets/characters/9/walk/down-left/1.png', 'hd'))
      .toBe('assets-hd/characters/9/walk/down-left/1.webp')
  })
})
