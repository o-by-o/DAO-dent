Отличный подход. Вот как это будет выглядеть **без хардкода, всё через БД + загрузка через терминал**:

---

## Архитектура (без хардкода)

```
Терминал (ты)                    Приложение (пользователь)
     │                                  │
     │  mux-upload.sh video.mp4         │  Заходит на school.dib-interfarm.ru
     │  → MUX API                       │  → NextAuth проверяет JWT
     │  → получает playback_id          │  → Prisma читает курсы из PostgreSQL
     │  → сохраняет в PostgreSQL        │  → MuxPlayer показывает видео по playback_id
     │    через prisma seed/script      │  → прогресс пишется в PostgreSQL
```

## Что нужно сделать в коде

### 1. Prisma — схема БД

Модели: `User`, `Course`, `Module`, `Lesson` (с полем `muxPlaybackId`), `Progress`, `Homework`, `Comment`. Все данные из базы, никакого хардкода в компонентах.

### 2. NextAuth.js — авторизация

Email + пароль, роли `ADMIN` / `STUDENT`, JWT-сессии (без Redis).

### 3. API Routes — серверная логика

Next.js API Routes для чтения курсов, отметки прогресса, загрузки ДЗ. Фронтенд-страницы станут серверными компонентами, которые читают данные из Prisma напрямую.

### 4. MUX — загрузка через терминал

Два варианта скриптов:

**Вариант A — Bash-скрипт:**
```bash
# upload-video.sh "Урок 7: Двойное очищение" ./video.mp4 lesson-id-123
# → загружает на MUX → получает playback_id → пишет в БД
```

**Вариант B — Node.js-скрипт:**
```bash
# npx tsx scripts/mux-upload.ts --file ./video.mp4 --lesson lesson-id-123
# → то же самое, но с прямым доступом к Prisma
```

Оба варианта:
- Берут видеофайл с диска
- Загружают через MUX API (direct upload)
- Получают `playback_id` и `asset_id`
- Записывают в поле `Lesson.muxPlaybackId` в PostgreSQL

### 5. MuxPlayer — замена HTML5-плеера

Текущий кастомный `VideoPlayer` компонент заменяется на `<MuxPlayer playbackId={lesson.muxPlaybackId}>` из уже установленного пакета `@mux/mux-player-react`.

---

## Итоговый рабочий процесс

```bash
# 1. Создать курс и уроки в БД (через seed-скрипт)
npx tsx scripts/seed-courses.ts

# 2. Загрузить видео для каждого урока
./scripts/upload-video.sh ./videos/lesson-01.mp4 --lesson-id clxyz123
./scripts/upload-video.sh ./videos/lesson-02.mp4 --lesson-id clxyz456
# ... и так 10 раз

# 3. Проверить
npx prisma studio  # визуально увидишь все уроки с playback_id
```

---

Сейчас я в режиме Ask и не могу вносить изменения. Переключи в **Agent mode** — и я начну с Prisma-схемы + скриптов загрузки MUX.