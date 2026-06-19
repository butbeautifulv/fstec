# FSTEC

Система учёта мер ФСТЭК и отслеживания статусов исполнения среди дочерних обществ (ДЗО).

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL + Prisma
- shadcn/ui + Tailwind CSS
- iron-session (admin auth)

## Quick start

```bash
cp .env.example .env.local
docker compose up -d db
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- Admin: http://localhost:3000/admin/login (seed: `admin@fstec.local` / `admin123`)
- Public assignment link: `/p/{token}` — dev tokens: `dev-rostec`, `dev-sber`, `dev-sber-it`, `dev-aeroflot`, `dev-roscosmos`

## Architecture

| Context | Path | Purpose |
|---------|------|---------|
| `admin` | `app/(admin)/admin/(panel)/` | Admin panel |
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
npm run db:seed      # seed admin + statuses + dev mock data
npm run db:seed:mock # reset and re-seed mock data (organizations, orders, links)
```

## Agent workflow

See [AGENTS.md](AGENTS.md) and [docs/plans/fstec_master.plan.md](docs/plans/fstec_master.plan.md).

Branch pattern: `fstec/phase-NN-slug`
