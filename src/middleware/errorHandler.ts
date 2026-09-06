import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError('Route not found', 404))
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 100 MB)' : err.message
    res.status(400).json({
      success: false,
      message,
    })
    return
  }

  console.error('[error]', err)

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
