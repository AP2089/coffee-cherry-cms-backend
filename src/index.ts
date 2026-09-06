import { createServer } from 'http'
import { connectDatabase } from './config/database'
import { env } from './config/env'
import { createApp } from './app'

async function bootstrap(): Promise<void> {
  await connectDatabase()

  const app = createApp()
  const httpServer = createServer(app)

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`[cms-backend] listening on 0.0.0.0:${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('[cms-backend] failed to start', error)
  process.exit(1)
})
