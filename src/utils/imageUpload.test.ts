import { describe, expect, it } from 'vitest'
import { buildImageFilename, sanitizeSlug } from '../utils/imageUpload'

describe('imageUpload utils', () => {
  it('sanitizes slug', () => {
    expect(sanitizeSlug(' Bloom-01 ')).toBe('bloom-01')
  })

  it('builds filename from slug and mimetype', () => {
    expect(buildImageFilename('bloom', 'image/jpeg', 'photo.JPG')).toBe('bloom.jpg')
  })
})
