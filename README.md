# CRM Boilerplate

Full-stack CRM/LMS platform boilerplate built with Next.js 16.

## Features

- **Auth**: NextAuth v5 with credentials, roles (ADMIN/STUDENT)
- **LMS**: Courses, modules, lessons, progress tracking, certificates
- **Shop**: Product catalog, cart, checkout, orders
- **CRM**: Client base, notes, call reminders, birthdays
- **Warehouse**: Stock management, receipts, sales, write-offs, batches
- **AI Agent**: Course generation with DeepSeek/OpenAI
- **AI Diagnostics**: Skin analysis with GPT-4o Vision + DeepSeek
- **Order Chat**: AI-powered product ordering via chat
- **Calendar**: Daily planner with Day/Week/Month views
- **Social**: Telegram/VK posting
- **Design System**: Boty — DM Sans + Playfair Display, warm palette, glassmorphism
- **Deploy**: Docker + Nginx + Certbot, GitHub Actions CI/CD

## Tech Stack

- Next.js 16 (App Router, standalone)
- TypeScript (strict mode)
- React 19, Tailwind CSS v4, Radix UI, shadcn/ui
- Prisma ORM + PostgreSQL 16
- Vercel AI SDK + DeepSeek + OpenAI
- Mux (video hosting)

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 2. Install dependencies
cd app && pnpm install

# 3. Copy environment
cp .env.example .env  # fill in values

# 4. Push schema
pnpm db:push

# 5. Seed data
pnpm db:seed

# 6. Start dev server
pnpm dev  # http://localhost:3001
```

## Customization

1. Replace branding in `components/brand-logo.tsx` and `components/landing/`
2. Update colors in `app/globals.css`
3. Modify `prisma/schema.prisma` for your domain models
4. Configure integrations via `.env`

## License

Private — for internal use only.
