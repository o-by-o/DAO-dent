# Deploy via GitHub Actions

## Что делает workflow

Файл `.github/workflows/deploy.yml`:

1. Подключается по SSH к `frontend-vm` (`51.250.88.91`, пользователь `deploy`).
2. Клонирует/обновляет репозиторий в `/home/deploy/dibinterfarm/db-interfarm`.
3. Создаёт `deploy/.env` из GitHub Secrets.
4. Собирает `school-cosmo` и поднимает `school-cosmo + nginx`.
5. При первом запуске запрашивает SSL-сертификат Let's Encrypt через `certbot`.
6. Переключает nginx в HTTPS-конфиг, запускает `certbot` в режиме автообновления.
7. Выполняет `prisma db push` внутри контейнера приложения.

## Обязательные GitHub Secrets

- `SSH_PRIVATE_KEY`
- `GH_REPO_TOKEN` (PAT с доступом к репозиторию, чтобы VM могла `git clone/pull`)
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`
- `DEEPSEEK_API_KEY`
- `POSTBOX_ACCESS_KEY_ID`
- `POSTBOX_SECRET_ACCESS_KEY`
- `EMAIL_FROM`
- `PAYMENT_WEBHOOK_SECRET`
- `CERTBOT_EMAIL` (email для Let's Encrypt уведомлений)

## Production DATABASE_URL

Используйте URL к postgresql-vm (внутренний IP):

`postgresql://cosmo_user:<PASSWORD>@10.128.0.25:5432/school_cosmo`

## Как запустить

1. Закоммитьте и запушьте изменения в `main`.
2. Откройте GitHub Actions.
3. Запустите workflow `Deploy School Cosmo` вручную (`workflow_dispatch`) или дождитесь авто-запуска на push в `main`.

## Важно перед первым запуском

1. DNS `dibinterfarm.ru` и `www.dibinterfarm.ru` должен указывать на `51.250.88.91`.
2. Порты `80/443` на VM должны быть свободны под docker-nginx.
