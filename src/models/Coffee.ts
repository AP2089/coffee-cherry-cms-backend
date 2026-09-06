import { Schema, model, type Document, type Model } from 'mongoose'
import type { CoffeeWeight, ICoffee } from '../types'

export interface CoffeeDocument extends ICoffee, Document {}

const coffeeSchema = new Schema<CoffeeDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    country: { type: String, required: true },
    region: { type: String, required: true },
    variety: { type: String, required: true },
    process: { type: String, required: true },
    altitude: { type: String, required: true },
    description: { type: String, required: true },
    story: { type: String, required: true },
    flavorNotes: { type: [String], required: true, default: [] },
    price: { type: Number, required: true, min: 0 },
    weights: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) =>
          value.every((w) => ([250, 500, 1000] as CoffeeWeight[]).includes(w as CoffeeWeight)),
        message: 'Weights must be 250, 500 or 1000',
      },
    },
    image: { type: String, default: '' },
    gallery: { type: [String], required: true, default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    translations: {
      type: {
        en: {
          name: { type: String, trim: true, default: '' },
          country: { type: String, trim: true, default: '' },
          region: { type: String, trim: true, default: '' },
          variety: { type: String, trim: true, default: '' },
          process: { type: String, trim: true, default: '' },
          altitude: { type: String, trim: true, default: '' },
          description: { type: String, trim: true, default: '' },
          story: { type: String, trim: true, default: '' },
          flavorNotes: { type: [String], default: [] },
        },
      },
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const Coffee: Model<CoffeeDocument> = model<CoffeeDocument>('Coffee', coffeeSchema)
