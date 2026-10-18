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

  it('does not activate an unaccepted panel with transparent content', () => {
    expect(profileAssetUrl('assets/companies/dialog.png', 'hd')).toBe('assets-hd/companies/dialog.webp')
  })

  it('keeps the existing completed buildings and character paths', () => {
    expect(profileAssetUrl('assets/companies/2.png', 'hd')).toBe('assets-hd/companies/2.webp')
    expect(profileAssetUrl('assets/characters/9/walk/down-left/1.png', 'hd'))
      .toBe('assets-hd/characters/9/walk/down-left/1.webp')
  })
})
