# Instagram Content Planner

Прототип планировщика Instagram-контента на стеке:

- Next.js (App Router) + React + TypeScript
- Prisma + PostgreSQL
- TailwindCSS (dark mode по умолчанию)

## Функционал

- Трёхколоночный layout с адаптивным sidebar/drawer.
- Страница `Лента` с Instagram-like grid 3:4 и FAB-кнопкой создания поста.
- Карусель в карточке поста и в детальном просмотре (до 10 изображений).
- Страница `Каталог изображений` с batch-upload, редактированием и soft-delete.
- Страница `Календарь` (month view) с индикаторами постов по дням.
- Полный CRUD для `Post` и `MediaAsset`.

## Настройка

1. Скопируйте пример переменных окружения:

```bash
cp .env.example .env
```

2. Укажите рабочий PostgreSQL URL в `.env`.

3. Примените миграцию:

```bash
npx prisma migrate dev
```

4. Запустите приложение:

```bash
npm run dev
```

## Полезные команды

```bash
npm run lint
npm run build
npm run prisma:generate
npm run prisma:studio
```
