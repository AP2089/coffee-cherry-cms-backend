import type { NextFunction, Request, Response } from 'express'
import { isDatabaseConnected } from '../config/database'
import * as coffeeService from '../services/coffee.service'
import type { CreateCoffeePayload, UpdateCoffeePayload } from '../types'

function parseQueryNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseLocale(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  return value.trim().toLowerCase()
}

export async function health(_req: Request, res: Response): Promise<void> {
  const dbOk = isDatabaseConnected()

  if (!dbOk) {
    res.status(503).json({
      status: 'error',
      mongodb: 'disconnected',
    })
    return
  }

  res.status(200).json({
    status: 'ok',
  })
}

export async function getCoffees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locale = parseLocale(req.query.locale)
    const limit = parseQueryNumber(req.query.limit)
    const offset = parseQueryNumber(req.query.offset)

    if (limit !== undefined || offset !== undefined) {
      const coffees = await coffeeService.listCoffees({ locale, limit, offset })
      res.json({ success: true, data: coffees })
      return
    }

    const coffees = await coffeeService.getAllCoffees(locale)
    res.json({ success: true, data: coffees })
  } catch (error) {
    next(error)
  }
}

export async function getCoffeeBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const locale = parseLocale(req.query.locale)
    const coffee = await coffeeService.getCoffeeBySlug(req.params.slug, locale)
    res.json({ success: true, data: coffee })
  } catch (error) {
    next(error)
  }
}

export async function updateCoffee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as UpdateCoffeePayload
    const coffee = await coffeeService.updateCoffee(req.params.slug, payload)
    res.json({ success: true, data: coffee })
  } catch (error) {
    next(error)
  }
}

export async function createCoffee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as CreateCoffeePayload
    const coffee = await coffeeService.createCoffee(payload)
    res.status(201).json({ success: true, data: coffee })
  } catch (error) {
    next(error)
  }
}

export async function deleteCoffee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await coffeeService.deleteCoffee(req.params.slug)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function deleteCoffeeImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const coffee = await coffeeService.deleteCoffeeImage(req.params.slug)
    res.json({ success: true, data: coffee })
  } catch (error) {
    next(error)
  }
}
