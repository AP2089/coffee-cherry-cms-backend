import fs from 'fs/promises'
import path from 'path'
import type { NextFunction, Request, Response } from 'express'
import { uploadsDir } from '../config/uploads'
import { AppError } from '../middleware/errorHandler'
import { buildImageFilename } from '../utils/imageUpload'

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tempPath = req.file ? path.join(uploadsDir, req.file.filename) : null

  try {
    if (!req.file || !tempPath) {
      throw new AppError('Image file is required', 400)
    }

    const filename = buildImageFilename(req.body.slug, req.file.mimetype, req.file.originalname)
    const finalPath = path.join(uploadsDir, filename)

    await fs.rename(tempPath, finalPath)

    res.status(201).json({
      success: true,
      data: {
        url: `/images/${filename}`,
      },
    })
  } catch (error) {
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {})
    }

    next(error)
  }
}
