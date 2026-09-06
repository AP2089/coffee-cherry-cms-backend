import path from 'path'
import { AppError } from '../middleware/errorHandler'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export function sanitizeSlug(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError('Slug is required', 400)
  }

  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')

  if (!slug) {
    throw new AppError('Invalid slug', 400)
  }

  return slug
}

export function resolveExtension(mimetype: string, originalName: string): string {
  const fromMime = MIME_TO_EXT[mimetype]

  if (fromMime) {
    return fromMime
  }

  const fromName = path.extname(originalName).toLowerCase()

  if (fromName === '.jpg' || fromName === '.jpeg' || fromName === '.png' || fromName === '.webp') {
    return fromName === '.jpeg' ? '.jpg' : fromName
  }

  throw new AppError('Unsupported image format', 400)
}

export function isAllowedImageMime(mimetype: string): boolean {
  return Boolean(MIME_TO_EXT[mimetype])
}

export function buildImageFilename(slug: string, mimetype: string, originalName: string): string {
  return `${sanitizeSlug(slug)}${resolveExtension(mimetype, originalName)}`
}

export function createTempFilename(mimetype: string, originalName: string): string {
  return `tmp-${Date.now().toString(36)}${resolveExtension(mimetype, originalName)}`
}
