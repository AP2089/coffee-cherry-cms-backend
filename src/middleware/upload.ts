import multer from 'multer'
import { AppError } from './errorHandler'
import { uploadsDir } from '../config/uploads'
import { createTempFilename, isAllowedImageMime } from '../utils/imageUpload'

const MAX_FILE_SIZE = 100 * 1024 * 1024

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir)
  },
  filename: (_req, file, callback) => {
    try {
      callback(null, createTempFilename(file.mimetype, file.originalname))
    } catch (error) {
      callback(error as Error, '')
    }
  },
})

export const uploadImageMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    if (isAllowedImageMime(file.mimetype)) {
      callback(null, true)
      return
    }

    callback(new AppError('Only JPEG, PNG and WebP images are allowed', 400))
  },
}).single('file')
