import fs from 'fs'
import path from 'path'
import { env } from './env'

export const uploadsDir = path.resolve(env.uploadsDir)

export function ensureUploadsDir(): void {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
