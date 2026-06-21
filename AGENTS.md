<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FSTEC Agent Rules

## Architecture (do not break)

Three contexts — shared logic in `lib/` only:

| Context | Path | Notes |
|---------|------|-------|
| `public` | `app/(public)/` | Token-based assignment pages (`/p/[token]`) |
| `platform` | `app/(platform)/panel/` | Authenticated workspace for all roles (`/panel/*`) |
| `api` | `app/api/` | Route Handlers |
| `lib` | `lib/` | Domain: `measures`, `orders`, `organizations`, `public`, `auth`, `db`, `nav`, `contacts`, `email`, `notifications`, `measure-imports`, `mail-inbox`, `cron` |

- Public pages call `/api/public/[token]` only (scoped by token).
- Platform pages call `/api/*` with session cookie (SUPER_ADMIN / OPERATOR / VIEWER).
- No secrets in git; read `.env.example`.

## UI (shadcn required)

- Use [.agents/skills/shadcn/SKILL.md](.agents/skills/shadcn/SKILL.md) for all UI work.
- Add components via `npx shadcn@latest add <component> -y` — do not hand-roll if registry has it.
- Forms: `FieldGroup` + `Field`; dropdowns: `Select`; notifications: `sonner`.
- Platform form cards: `FormCardGrid` / `FormCardLayout` (`components/shared/form-card-grid.tsx`) — `grid gap-4 lg:grid-cols-2`; cards left-to-right on `lg+`, `FormActionsBar` below full width; **single-card** forms use `FormCardLayout singleCard` so the card and actions share the left column width; inputs/selects/textareas use full card width (`w-full`, no `max-w-*` on controls).
- Platform layout: shadcn `Sidebar` (`components/platform/`, group label «Платформа»).
- Responsive: `PageHeader` actions wrap/stack on narrow screens; bar charts use fixed height (`!aspect-auto` + `h-64`/`h-96`), not `aspect-video`; dashboard grids use `@container/main` (`@2xl/main`, `@4xl/main`, `@5xl/main`); sidebar auto-collapses to icon rail below 1024px unless manually expanded in session.
- Loading states: every route segment must have `loading.tsx` using `RouteSkeleton` from `components/shared/skeletons/` with the matching variant. Skeleton layout mirrors real pages: `PageContentShell` (`min-w-0 gap-4 md:gap-6`) inside shell padding — no extra `max-w-*` / `p-6` on public/report skeletons. Dashboard grids use container queries (`@2xl/main`, `@4xl/main`, `@5xl/main`), not viewport `md/lg`. Table toolbar skeletons use `flex-wrap` and search `max-w-sm`.

| Page type | `RouteSkeleton` variant |
|-----------|-------------------------|
| List / data table | `table` |
| Create / edit form | `form` (`singleCard` for one-card pages) |
| Dashboard | `dashboard` |
| Order / org detail | `detail-table` |
| Response / delay detail | `detail-cards` |
| Settings hub | `settings-hub` |
| Public list | `public-table` |
| Public item detail | `public-detail` |

Client-side fetch >200ms must show the same variant skeleton (not empty div or text «Загрузка...»). Re-exports: `PageSkeleton` → `TablePageSkeleton`, `PublicPageSkeleton` → `PublicTablePageSkeleton`.

## Verify before finishing

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

После `prisma migrate dev` — выполните `npm run db:generate` и перезапустите dev-сервер (иначе `prisma.contactPerson` может быть undefined при HMR).

Plus smokes from phase plan (curl platform API, open `/p/{token}`).

Production deploy: [docs/deployment.md](docs/deployment.md).

Measure import (DOCX): `/panel/measures/imports`, tests: `npm run test:parse-docx`, `npm run test:batch-targets`, `npm run test:unit`.

## Multi-phase work

1. Master plan: `docs/plans/fstec_master.plan.md`
2. Phase plan in `docs/plans/`
3. Branch: `fstec/phase-NN-slug`
4. Implement → PR → critic → merge → update master plan

## Agent rules (`.agents/rules/`)

| Rule | Purpose |
|------|---------|
| `fstec-agent-workflow.mdc` | End-of-task workflow, architecture |
| `fstec-agent-critic.mdc` | PR review gate |
| `fstec-agent-subagents.mdc` | Parallel implementer spawning |
| `fstec-agent-kaizen.mdc` | Error metacognition |
| `fstec-agent-documentation.mdc` | Docs sync after merge |
| `fstec-agent-parallel-branches.mdc` | Branch naming & merge |
| `fstec-agent-security.mdc` | Security checklist |
| `fstec-karpathy-guidelines.mdc` | Behavioral guidelines |

## Skills

- Next.js: `.agents/skills/next-best-practices/`
- shadcn/ui: `.agents/skills/shadcn/`
- Workflow: `.agents/skills/fstec-karpathy-guidelines/`
