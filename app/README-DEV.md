# Локальный запуск — Школа косметологов

## 1. Запустить Docker

Открой **Docker Desktop** и дождись, пока он полностью запустится (иконка в меню перестанет мигать). Без этого PostgreSQL не поднимется.

## 2. Поднять БД и приложение

В терминале перейди в папку `school-cosmo` и выполни по порядку:

```bash
cd school-cosmo

# PostgreSQL (порт 5433, чтобы не конфликтовать с системным Postgres на 5432)
docker compose -f docker-compose.dev.yml up -d

# Подожди 5–10 секунд, затем создай таблицы (в т.ч. agent_conversations для чата генерации курсов)
pnpm db:push
# либо при деплое: pnpm db:migrate

# Заполнить курсы и тестовых пользователей
pnpm db:seed

# Запуск приложения
pnpm dev
```

Открой в браузере: **http://localhost:3001**

## 3. Тестовые аккаунты (после seed)

| Роль    | Email                  | Пароль    |
|---------|------------------------|-----------|
| Админ   | admin@dib-interfarm.ru | admin123  |
| Студент | student@test.ru       | student123 |

## 4. Войти теми же логином/паролем, что и на проде

Локально приложение подключается к **локальной** БД (см. `DATABASE_URL` в `.env`). На проде — к продовой. Это две разные базы: пользователи с прода здесь по умолчанию не видны.

Чтобы входить локально теми же данными, что и на проде, добавь этого пользователя в локальную БД (или обнови пароль):

```bash
pnpm db:add-user "твой@email.ru" "твой_пароль"
# или
npm run db:add-user -- твой@email.ru твой_пароль
```

После этого логин/пароль на http://localhost:3001 будут совпадать с продом.

## 5. Ошибка «table agent_conversations does not exist»

Если при открытии «Генерация курсов» /admin/courses/generate видишь такую ошибку — в каталоге приложения выполни один раз:

```bash
pnpm db:push
# или
npm run db:push
```

## 6. Остановить PostgreSQL

```bash
docker compose -f docker-compose.dev.yml down
```

Данные сохраняются в volume `postgres_data`. Чтобы удалить и начать с нуля:

```bash
docker compose -f docker-compose.dev.yml down -v
```
