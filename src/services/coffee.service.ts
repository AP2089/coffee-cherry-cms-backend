import { Coffee } from '../models/Coffee'
import fs from 'fs/promises'
import path from 'path'
import { uploadsDir } from '../config/uploads'
import { AppError } from '../middleware/errorHandler'
import type {
  CoffeeWeight,
  CreateCoffeePayload,
  ICoffee,
  ICoffeeLocalizedContent,
  ICoffeeTranslations,
  PaginatedList,
  UpdateCoffeePayload,
} from '../types'

export type CoffeeDTO = ICoffee & { _id: string }

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_WEIGHTS: CoffeeWeight[] = [250, 500, 1000]
const PAGE_SIZE_DEFAULT = 20
const PAGE_SIZE_MAX = 100

function clampPageSize(limit?: number): number {
  const value = limit ?? PAGE_SIZE_DEFAULT
  return Math.min(Math.max(value, 1), PAGE_SIZE_MAX)
}

function toCoffeeDTO(doc: unknown): CoffeeDTO {
  const raw = doc as ICoffee & { _id: unknown; __v?: unknown }
  return {
    _id: String(raw._id),
    name: raw.name,
    slug: raw.slug,
    country: raw.country,
    region: raw.region,
    variety: raw.variety,
    process: raw.process,
    altitude: raw.altitude,
    description: raw.description,
    story: raw.story,
    flavorNotes: [...raw.flavorNotes],
    price: raw.price,
    weights: [...raw.weights],
    image: raw.image,
    gallery: [...raw.gallery],
    stock: raw.stock,
    translations: raw.translations?.en
      ? {
          en: {
            name: raw.translations.en.name || '',
            country: raw.translations.en.country,
            region: raw.translations.en.region,
            variety: raw.translations.en.variety || '',
            process: raw.translations.en.process,
            altitude: raw.translations.en.altitude || '',
            description: raw.translations.en.description,
            story: raw.translations.en.story,
            flavorNotes: [...raw.translations.en.flavorNotes],
          },
        }
      : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

function applyTranslation(coffee: CoffeeDTO, locale?: string): CoffeeDTO {
  if (!locale || locale === 'ru') return coffee

  const translation = coffee.translations?.en
  if (!translation?.description) return coffee

  return {
    ...coffee,
    name: translation.name || coffee.name,
    country: translation.country,
    region: translation.region,
    variety: translation.variety || coffee.variety,
    process: translation.process,
    altitude: translation.altitude || coffee.altitude,
    description: translation.description,
    story: translation.story,
    flavorNotes: [...translation.flavorNotes],
  }
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase()
}

function validateSlug(slug: string): string {
  const normalized = normalizeSlug(slug)

  if (!normalized || !SLUG_PATTERN.test(normalized)) {
    throw new AppError('Slug must contain only lowercase letters, numbers and hyphens', 400)
  }

  return normalized
}

function validateWeights(weights: CoffeeWeight[]): CoffeeWeight[] {
  if (!weights?.length) {
    throw new AppError('At least one weight is required', 400)
  }

  const unique = [...new Set(weights)]

  if (!unique.every((weight) => ALLOWED_WEIGHTS.includes(weight))) {
    throw new AppError('Weights must be 250, 500 or 1000', 400)
  }

  return unique
}

function validateFlavorNotes(flavorNotes: string[]): string[] {
  const notes = flavorNotes.map((note) => note.trim()).filter(Boolean)

  if (!notes.length) {
    throw new AppError('At least one flavor note is required', 400)
  }

  return notes
}

function normalizeLocalizedContent(payload: ICoffeeLocalizedContent): ICoffeeLocalizedContent {
  const country = payload.country?.trim()
  const region = payload.region?.trim()
  const process = payload.process?.trim()
  const description = payload.description?.trim()
  const story = payload.story?.trim()

  if (!country || !region || !process || !description || !story) {
    throw new AppError('Country, region, process, description and story are required', 400)
  }

  const flavorNotes = validateFlavorNotes(payload.flavorNotes || [])

  return {
    name: payload.name?.trim() || '',
    country,
    region,
    variety: payload.variety?.trim() || '',
    process,
    altitude: payload.altitude?.trim() || '',
    description,
    story,
    flavorNotes,
  }
}

export async function getAllCoffees(locale?: string): Promise<CoffeeDTO[]> {
  const coffees = await Coffee.find().sort({ createdAt: 1 }).lean().exec()
  return coffees.map((coffee) => applyTranslation(toCoffeeDTO(coffee), locale))
}

export async function listCoffees(options?: {
  locale?: string
  limit?: number
  offset?: number
}): Promise<PaginatedList<CoffeeDTO>> {
  const limit = clampPageSize(options?.limit)
  const offset = Math.max(options?.offset ?? 0, 0)

  const [items, total] = await Promise.all([
    Coffee.find().sort({ createdAt: 1 }).skip(offset).limit(limit).lean().exec(),
    Coffee.countDocuments().exec(),
  ])

  const dtos = items.map((coffee) => applyTranslation(toCoffeeDTO(coffee), options?.locale))

  return {
    items: dtos,
    total,
    hasMore: offset + items.length < total,
  }
}

export async function getCoffeeBySlug(slug: string, locale?: string): Promise<CoffeeDTO> {
  const coffee = await Coffee.findOne({ slug: slug.toLowerCase() }).lean().exec()

  if (!coffee) {
    throw new AppError(`Coffee "${slug}" not found`, 404)
  }

  return applyTranslation(toCoffeeDTO(coffee), locale)
}

export async function getCoffeeById(id: string): Promise<CoffeeDTO> {
  const coffee = await Coffee.findById(id).lean().exec()

  if (!coffee) {
    throw new AppError('Coffee not found', 404)
  }

  return toCoffeeDTO(coffee)
}

export async function decreaseStock(id: string, quantity: number): Promise<CoffeeDTO> {
  const coffee = await Coffee.findOneAndUpdate(
    { _id: id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true },
  )
    .lean()
    .exec()

  if (!coffee) {
    throw new AppError('Insufficient stock', 400)
  }

  return toCoffeeDTO(coffee)
}

export async function updateCoffee(slug: string, payload: UpdateCoffeePayload): Promise<CoffeeDTO> {
  const update: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    const name = payload.name.trim()
    if (!name) throw new AppError('Name is required', 400)
    update.name = name
  }

  if (payload.country !== undefined) {
    const country = payload.country.trim()
    if (!country) throw new AppError('Country is required', 400)
    update.country = country
  }

  if (payload.region !== undefined) {
    const region = payload.region.trim()
    if (!region) throw new AppError('Region is required', 400)
    update.region = region
  }

  if (payload.variety !== undefined) {
    update.variety = payload.variety.trim()
  }

  if (payload.process !== undefined) {
    const process = payload.process.trim()
    if (!process) throw new AppError('Process is required', 400)
    update.process = process
  }

  if (payload.altitude !== undefined) {
    update.altitude = payload.altitude.trim()
  }

  if (payload.description !== undefined) {
    const description = payload.description.trim()
    if (!description) throw new AppError('Description is required', 400)
    update.description = description
  }

  if (payload.story !== undefined) {
    const story = payload.story.trim()
    if (!story) throw new AppError('Story is required', 400)
    update.story = story
  }

  if (payload.flavorNotes !== undefined) {
    update.flavorNotes = validateFlavorNotes(payload.flavorNotes)
  }

  if (payload.price !== undefined) {
    if (typeof payload.price !== 'number' || payload.price < 0) {
      throw new AppError('Price must be a non-negative number', 400)
    }
    update.price = payload.price
  }

  if (payload.stock !== undefined) {
    if (typeof payload.stock !== 'number' || payload.stock < 0) {
      throw new AppError('Stock must be a non-negative number', 400)
    }
    update.stock = payload.stock
  }

  if (payload.weights !== undefined) {
    update.weights = validateWeights(payload.weights)
  }

  if (payload.image !== undefined) {
    const image = payload.image.trim()
    update.image = image

    if (!image && payload.gallery === undefined) {
      update.gallery = []
    }
  }

  if (payload.gallery !== undefined) {
    update.gallery = payload.gallery.map((item) => item.trim()).filter(Boolean)
  }

  if (payload.translations?.en) {
    update['translations.en'] = normalizeLocalizedContent(payload.translations.en)
  }

  if (!Object.keys(update).length) {
    throw new AppError('No fields to update', 400)
  }

  const coffee = await Coffee.findOneAndUpdate(
    { slug: slug.toLowerCase() },
    { $set: update },
    { new: true },
  )
    .lean()
    .exec()

  if (!coffee) {
    throw new AppError(`Coffee "${slug}" not found`, 404)
  }

  return toCoffeeDTO(coffee)
}

export async function createCoffee(payload: CreateCoffeePayload): Promise<CoffeeDTO> {
  const slug = validateSlug(payload.slug)
  const name = payload.name?.trim()
  const country = payload.country?.trim()
  const region = payload.region?.trim()
  const variety = payload.variety?.trim()
  const process = payload.process?.trim()
  const altitude = payload.altitude?.trim()
  const description = payload.description?.trim()
  const story = payload.story?.trim()

  if (!name) throw new AppError('Name is required', 400)
  if (!country) throw new AppError('Country is required', 400)
  if (!region) throw new AppError('Region is required', 400)
  if (!variety) throw new AppError('Variety is required', 400)
  if (!process) throw new AppError('Process is required', 400)
  if (!altitude) throw new AppError('Altitude is required', 400)
  if (!description) throw new AppError('Description is required', 400)
  if (!story) throw new AppError('Story is required', 400)

  if (typeof payload.price !== 'number' || payload.price < 0) {
    throw new AppError('Price must be a non-negative number', 400)
  }

  const stock = payload.stock ?? 0
  if (typeof stock !== 'number' || stock < 0) {
    throw new AppError('Stock must be a non-negative number', 400)
  }

  const weights = validateWeights(payload.weights)
  const flavorNotes = validateFlavorNotes(payload.flavorNotes)
  const image = payload.image?.trim() || `/images/${slug}.jpg`
  const gallery = payload.gallery?.length
    ? payload.gallery.map((item) => item.trim()).filter(Boolean)
    : [image]

  const existing = await Coffee.findOne({ slug }).lean().exec()
  if (existing) {
    throw new AppError(`Coffee with slug "${slug}" already exists`, 409)
  }

  const translations: ICoffeeTranslations | undefined = payload.translations?.en
    ? { en: normalizeLocalizedContent(payload.translations.en) }
    : undefined

  const coffee = await Coffee.create({
    slug,
    name,
    country,
    region,
    variety,
    process,
    altitude,
    description,
    story,
    flavorNotes,
    price: payload.price,
    weights,
    image,
    gallery,
    stock,
    translations,
  })

  return toCoffeeDTO(coffee.toObject())
}

async function deleteImageFile(imagePath: string): Promise<void> {
  if (!imagePath.startsWith('/images/')) return

  const filename = path.basename(imagePath)

  if (!/^[\w.-]+\.(?:jpe?g|png|webp)$/i.test(filename)) return

  await fs.unlink(path.join(uploadsDir, filename)).catch(() => {})
}

export async function deleteCoffeeImage(slug: string): Promise<CoffeeDTO> {
  const normalizedSlug = normalizeSlug(slug)
  const coffee = await Coffee.findOne({ slug: normalizedSlug }).exec()

  if (!coffee) {
    throw new AppError(`Coffee "${slug}" not found`, 404)
  }

  const filesToDelete = new Set<string>([coffee.image, ...coffee.gallery])

  coffee.image = ''
  coffee.gallery = []
  await coffee.save()

  await Promise.all([...filesToDelete].map((imagePath) => deleteImageFile(imagePath)))

  return toCoffeeDTO(coffee.toObject())
}

export async function deleteCoffee(slug: string): Promise<void> {
  const normalizedSlug = normalizeSlug(slug)
  const coffee = await Coffee.findOneAndDelete({ slug: normalizedSlug }).exec()

  if (!coffee) {
    throw new AppError(`Coffee "${slug}" not found`, 404)
  }
}
