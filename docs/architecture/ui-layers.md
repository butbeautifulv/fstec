# UI layers: FSTEC vs cxado-gui

Boundary map for DRY-prep and strangler migration into [@cxado/gui](https://github.com/butbeautifulv/cxado-gui).

## Strangler re-exports (active)

FSTEC keeps `@/…` import paths; file bodies re-export from `@cxado/gui`:

| Tier | FSTEC path | Source |
|------|------------|--------|
| 1 Core | `components/ui/*`, `shell/*`, `motion/*`, `theme-*` | `@cxado/gui/ui`, `shell`, `motion`, `theme` |
| 1 Core | `components/data-table/*`, `shared/skeletons/*` | `@cxado/gui/data-table`, `skeletons` |
| 1 Core | `lib/utils.ts`, `hooks/use-mobile.ts`, `hooks/use-compact-shell.ts` | `@cxado/gui/utils`, `hooks` |
| 1 Core | `app/globals.css` | `@import "@cxado/gui/tailwind.preset.css"` |
| 2 Layout | `shared/page-header`, `form-card-grid`, `share-link-*`, `attachment-gallery`, … | `@cxado/gui/layout` |
| 2 Forms | `shared/form-error-slot`, `commentary-attachments-field` (wrapper) | `@cxado/gui/layout`, `forms` |
| 2 Tables | `shared/tracked-items-data-table`, `lib/data-table/columns/*` | `@cxado/gui/tables`, `columns` |
| 2 Charts | `dashboard/chart-*`, `stacked-status-breakdown-chart`, `dashboard-chart-shared` | `@cxado/gui/charts` |
| 3 Dashboard | Most `components/dashboard/*` (client) | `@cxado/gui/dashboard` + FSTEC `presentation` wrappers |
| 3 Adapter | `lib/cxado-gui/fstec-adapter.ts` | `FSTEC_DASHBOARD_PRESENTATION` → gui types |

## Stays in FSTEC (domain — АО «МАШ»)

| Layer | Path | Reason |
|-------|------|--------|
| Domain logic | `lib/measures`, `orders`, `responses`, `delays`, `measure-imports`, … | FSTEC compliance model |
| Data / API | `prisma/`, `app/api/` | Backend |
| Workflow rules | `lib/statuses/workflow.ts` | Business rules (overdue, terminal) |
| Dashboard data | `lib/dashboard/stats.ts`, `cache.ts`, `serialize-dashboard.ts` | Server-side aggregation |
| Dashboard server | `dashboard-matrix-section.tsx`, `dashboard-page-shell.tsx` | Prisma fetch + Suspense |
| Dashboard routing | `dashboard-scoped-table.tsx`, `lib/dashboard/link-targets.ts` | FSTEC URL targets |
| Platform CRUD | `components/platform/*` | Measure import, org CRUD |
| Public portal | `components/public/*` | Token assignment UX |
| Report share | `components/report/*` | Read-only share UX |
| Adapters | `lib/dashboard/presentation-config.ts`, `lib/ui/table-labels.ts` | FSTEC-specific labels/order |
| Wrappers | `measures-data-table.tsx`, `dashboard-interactive.tsx` | Inject labels, workflow, scoped table |

## Shared prep (phases 38–43)

- `lib/ui/review-status.ts` — Prisma-free review status type
- `lib/ui/table-labels.ts` — configurable column labels
- `lib/ui/tracked-item-types.ts` — generic tracked-item row
- `components/shared/measures-data-table.tsx` — FSTEC wrapper over gui `TrackedItemsDataTable`
- `lib/dashboard/presentation-config.ts` — UI adapter surface for dashboard framework

## Import rule

UI components under `components/shared/` must not import `@prisma/client`. Domain types live in `lib/` and are mapped at route/page boundaries.

## cxado-gui package

| Install | Path |
|---------|------|
| Local sibling (FSTEC dev) | `file:../cxado-gui` in [package.json](../package.json) |
| Meta-repo submodule | `shared/gui` in [cys_framework](https://github.com/butbeautifulv/cxado) → `make gui-link` |

Consumer setup: [cxado-gui/docs/gui-consumer.md](https://github.com/butbeautifulv/cxado-gui/blob/main/docs/gui-consumer.md).

**Not yet in scope:** mass rewrite of app imports to `@cxado/gui/*` (strangler keeps `@/components/ui/…`).
