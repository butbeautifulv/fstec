# FSTEC

Система учёта мер ФСТЭК и отслеживания статусов исполнения среди дочерних обществ (ДЗО).

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL + Prisma
- shadcn/ui + Tailwind CSS
- iron-session (platform auth)

## Quick start

```bash
cp .env.example .env.local
docker compose up -d db minio
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- Platform login: http://localhost:3000/login (seed: `admin@fstec.local` / `admin123`)
- Public assignment link: `/p/{token}` — полный список dev-токенов выводится в консоль после `npm run db:seed:mock`

## Architecture

| Context | Path | Purpose |
|---------|------|---------|
| `platform` | `app/(platform)/panel/` | Authenticated workspace (`/panel/*`) |
| `public` | `app/(public)/p/[token]/` | ДЗО assignment pages |
| `api` | `app/api/` | Route Handlers |
| `lib` | `lib/` | Domain logic + Prisma |

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run db:migrate   # Prisma migrate
npm run db:seed      # seed admin + statuses + dev mock data (120 measures, 120 orders)
npm run db:seed:mock # reset legacy/mock data and re-seed (see console for /p/{token} links)
```

## Agent workflow

See [AGENTS.md](AGENTS.md) and [docs/plans/fstec_master.plan.md](docs/plans/fstec_master.plan.md).

Branch pattern: `fstec/phase-NN-slug`
