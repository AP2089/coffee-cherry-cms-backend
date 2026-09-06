import { Router } from 'express'
import * as controller from '../controllers'
import * as authController from '../controllers/auth.controller'
import * as uploadController from '../controllers/upload.controller'
import { requireAuth, forbidGuest } from '../middleware/auth'
import { uploadImageMiddleware } from '../middleware/upload'

const router = Router()

router.get('/health', controller.health)
router.post(
  '/uploads',
  requireAuth,
  forbidGuest,
  uploadImageMiddleware,
  uploadController.uploadImage,
)
router.get('/coffees', controller.getCoffees)
router.post('/coffees', requireAuth, forbidGuest, controller.createCoffee)
router.get('/coffees/:slug', controller.getCoffeeBySlug)
router.patch('/coffees/:slug', requireAuth, forbidGuest, controller.updateCoffee)
router.delete('/coffees/:slug/image', requireAuth, forbidGuest, controller.deleteCoffeeImage)
router.delete('/coffees/:slug', requireAuth, forbidGuest, controller.deleteCoffee)

router.post('/auth/login', authController.login)
router.get('/auth/me', requireAuth, authController.me)

export default router
