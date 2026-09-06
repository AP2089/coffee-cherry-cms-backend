import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('CMS HTTP app', () => {
  const app = createApp()

  it('GET / returns api info', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ name: 'coffee cherry cms api', version: '1.0.0' })
  })

  it('POST /api/uploads requires auth', async () => {
    const response = await request(app).post('/api/uploads')

    expect(response.status).toBe(401)
  })

  it('POST /api/coffees requires auth', async () => {
    const response = await request(app).post('/api/coffees').send({})

    expect(response.status).toBe(401)
  })
})
