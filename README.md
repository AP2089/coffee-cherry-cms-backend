# Coffee Cherry CMS Backend

API каталога для CMS (CRUD кофе, uploads, auth).

## Переменные окружения

- `PORT` — порт API, по умолчанию `3011`.
- `MONGO_URI` — строка подключения к MongoDB.
- `NODE_ENV` — режим запуска.
- `CORS_ORIGIN` — разрешённые origins через запятую.
- `CORS_RELAXED_LOCAL` — разрешить локальные origins.
- `JWT_SECRET` — секрет JWT.
- `UPLOADS_DIR` — каталог загружаемых изображений.

## Scripts

- `npm run dev` — dev-сервер.
- `npm run build` — сборка TypeScript.
- `npm start` — запуск production-сборки.
- `npm run lint` / `npm run lint:fix` — ESLint.
- `npm run format` / `npm run format:check` — Prettier.
- `npm test` / `npm run test:watch` — тесты.
