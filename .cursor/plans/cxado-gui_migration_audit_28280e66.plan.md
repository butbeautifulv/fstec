---
name: cxado-gui migration audit
overview: Аудит оставшегося переиспользуемого UI в FSTEC, доводка cxado-gui до самодостаточного пакета, публикация в GitHub, интеграция как shared/gui в meta-repo /home/bbv/Desktop/cys_framework/, постепенная миграция импортов FSTEC.
todos:
  - id: gui-0-repo
    content: "Gui-0: git init cxado-gui, push butbeautifulv/cxado-gui, submodule shared/gui в cys_framework + Makefile gui-link"
    status: completed
  - id: gui-1-decouple
    content: "Gui-1: fix columns path, generic chart types, убрать FSTEC deps, DataTableShell/FormSkeleton/notify, typecheck green"
    status: completed
  - id: gui-2a-reexports-ui
    content: "Gui-2a: FSTEC components/ui + motion + shell + theme → re-export @cxado/gui"
    status: completed
  - id: gui-2b-reexports-dt
    content: "Gui-2b: data-table + skeletons re-exports + tailwind preset import"
    status: completed
  - id: gui-3-tier2
    content: "Gui-3: layout/forms/charts/columns/tables re-exports + form-error-slot, attachment-gallery, empty-table-state"
    status: completed
  - id: gui-4-dashboard
    content: "Gui-4: generic dashboard lib, ComplianceDashboard orchestrator, FSTEC adapter wiring"
    status: completed
  - id: gui-5-docs
    content: "Gui-5: ui-layers.md, gui-consumer.md, fstec_master phases 44+, veil gui-link pilot"
    status: completed
isProject: false
---

# cxado-gui: аудит + план миграции

## Текущее состояние (после фаз 38–43)

| Что сделано | Где |
|-------------|-----|
| DRY-prep (review-status, table-labels, tracked-items, charts DRY, presentation-config) | [fstec/](file:///home/bbv/Desktop/fstec/fstec) |
| Скaffold `@cxado/gui` v0.1.0 (~131 файл) | [/home/bbv/Desktop/fstec/cxado-gui](file:///home/bbv/Desktop/fstec/cxado-gui) |
| `file:../cxado-gui` в package.json | [fstec/package.json](file:///home/bbv/Desktop/fstec/fstec/package.json) |
| Адаптер типов (без runtime-импорта gui) | [lib/cxado-gui/fstec-adapter.ts](file:///home/bbv/Desktop/fstec/fstec/lib/cxado-gui/fstec-adapter.ts) |
| Документация границ | [docs/architecture/ui-layers.md](file:///home/bbv/Desktop/fstec/fstec/docs/architecture/ui-layers.md) |

**Критично:** FSTEC **ни одного** runtime-импорта `@cxado/gui/*` не использует — всё ещё `@/components/ui/*` (~100+ файлов). Пакет — копия «на диске», не подключённый слой.

**Meta-repo:** [/home/bbv/Desktop/cys_framework/](file:///home/bbv/Desktop/cys_framework/) (локальный cxado). Есть `shared/skills`, `shared/references`, `shared/agent-rules`; **`shared/gui` отсутствует**. FSTEC в submodules нет.

```mermaid
flowchart LR
  subgraph today [Сейчас]
    FSTEC[fstec/fstec]
    GUI[cxado-gui sibling]
    META[cys_framework]
    FSTEC -.->|file dep unused| GUI
    META --> SK[shared/skills]
    META --> REF[shared/references]
  end

  subgraph target [Цель]
    FSTEC2[FSTEC app]
    GUI2[shared/gui submodule]
    META2[cys_framework]
    META2 --> GUI2
    FSTEC2 -->|@cxado/gui imports| GUI2
  end
```

---

## Аудит: что ещё переиспользуемо

### A. Уже в cxado-gui, но сломано (52 `@/` импорта в 28 файлах)

| Блокер | Файлы | Решение |
|--------|-------|---------|
| Skeletons → platform | `skeletons/*` → `DataTableShell` | Вынести [data-table-shell.tsx](file:///home/bbv/Desktop/fstec/fstec/components/platform/data-table-shell.tsx) в `gui/layout/` |
| Skeletons → shared | `form-page-skeleton` → `FormSkeleton` | Вынести [form-skeleton.tsx](file:///home/bbv/Desktop/fstec/fstec/components/shared/form-skeleton.tsx) в `gui/skeletons/` |
| Skeletons → dashboard | `primitives.tsx` → chart skeleton | Вынести chart skeleton primitives в `gui/skeletons/` |
| Dashboard → lib/dashboard | 12 dashboard files | Generic types + injectable `presentation` (см. фазу Gui-4) |
| Charts → FSTEC presentation | `FSTEC_DASHBOARD_PRESENTATION` в gui | **Удалить** из gui; только prop/config от app |
| Tables → workflow | `tracked-items-data-table` | Callback props: `getDisplayStatus`, `isOverdue` |
| Layout → feedback | share-link-*, form-actions-bar | `lib/ui/notify.ts` + `FormErrorSlot` в gui |
| Data-table → timezone | faceted-filter, active-filters | Optional `useTimezone` prop или peer context interface |
| format-filter-value | datetime lib | Generic formatter + optional timezone inject |
| motion-workflow-panel | `ItemWorkflowPhase` из fstec | Перенести type в `gui/motion/types.ts` |
| **Баг пути** | `src/columns/columns/*` | Переместить в `src/columns/` |

### B. В FSTEC, ещё не скопировано в gui (кандидаты Tier 2+)

| Модуль | Путь | Переиспользуемость | Зависимости |
|--------|------|-------------------|-------------|
| Form error slot | [form-error-slot.tsx](file:///home/bbv/Desktop/fstec/fstec/components/shared/form-error-slot.tsx) | Высокая | ui only |
| Attachment gallery | [attachment-gallery.tsx](file:///home/bbv/Desktop/fstec/fstec/components/shared/attachment-gallery.tsx) | Высокая | ui |
| Response revision alert | [response-revision-alert.tsx](file:///home/bbv/Desktop/fstec/fstec/components/shared/response-revision-alert.tsx) | Средняя | ui |
| Empty table state | [empty-table-state.tsx](file:///home/bbv/Desktop/fstec/fstec/components/platform/crud/empty-table-state.tsx) | Высокая | ui |
| CRUD table shell | [static-crud-table.tsx](file:///home/bbv/Desktop/fstec/fstec/components/platform/crud/static-crud-table.tsx) | Средняя | data-table |
| Login form shell | [login-form.tsx](file:///home/bbv/Desktop/fstec/fstec/components/login-form.tsx) | Средняя | branding via props |
| Nav user | [nav-user.tsx](file:///home/bbv/Desktop/fstec/fstec/components/nav-user.tsx) | Средняя | session via props |
| Item detail cards | [item-detail/*](file:///home/bbv/Desktop/fstec/fstec/components/shared/item-detail/) | Средняя | compliance pattern; labels via props |
| Feedback/toast | [lib/ui/feedback.ts](file:///home/bbv/Desktop/fstec/fstec/lib/ui/feedback.ts) | Высокая | sonner wrapper |

### C. Dashboard — неполная копия в gui

В FSTEC: **25** файлов в `components/dashboard/`. В gui скопировано **12** — отсутствуют:

- `dashboard-filters-bar`, `dashboard-period-section`, `dashboard-matrix-section`
- `dashboard-scoped-table`, `charts-lazy-boundary`
- `dashboard-chart-card`, `*-skeleton` (кроме частично)
- `dashboard-chart-status-faceted-filter`

Для Tier 3 нужно либо досинкать все 25, либо оставить data-fetch (`dashboard-matrix-section`) в FSTEC и в gui держать только presentational слой.

### D. Сознательно остаётся в FSTEC (не выносить)

- `lib/measures`, `orders`, `responses`, `measure-imports`, `prisma/`, `app/api/`
- `components/platform/*` CRUD, DOCX import
- `components/public/*`, `components/report/*`
- `lib/dashboard/stats.ts`, `cache.ts`, `serialize-dashboard.ts` (data layer)
- `lib/statuses/workflow.ts` (бизнес-правила; gui получает только labels/order через `presentation`)
- `timezone-provider`, `locale-provider` (app-level; gui — optional peer)

---

## План работ (6 волн)

### Wave Gui-0 — Репозиторий + meta-repo (1 PR в cxado-gui, 1 PR в cys_framework)

**cxado-gui** ([/home/bbv/Desktop/fstec/cxado-gui](file:///home/bbv/Desktop/fstec/cxado-gui)):

1. `git init`, `.gitignore` (node_modules, dist)
2. `README.md` — install, peers, tailwind preset
3. `.github/workflows/ci.yml` — `npm run typecheck` (после Gui-1)
4. Initial commit → push `butbeautifulv/cxado-gui`

**cys_framework** ([/home/bbv/Desktop/cys_framework/](file:///home/bbv/Desktop/cys_framework/)):

1. Добавить в [`.gitmodules`](file:///home/bbv/Desktop/cys_framework/.gitmodules):
   ```
   [submodule "shared/gui"]
     path = shared/gui
     url = https://github.com/butbeautifulv/cxado-gui.git
   ```
2. `git submodule add` → `shared/gui`
3. Новый [`scripts/link-gui.sh`](file:///home/bbv/Desktop/cys_framework/scripts/link-gui.sh) — symlink или `npm link` в проекты (по образцу [link-skills.sh](file:///home/bbv/Desktop/cys_framework/scripts/link-skills.sh))
4. [`Makefile`](file:///home/bbv/Desktop/cys_framework/Makefile): `gui-link`, `gui-install`; вызов в [`bootstrap.sh`](file:///home/bbv/Desktop/cys_framework/scripts/bootstrap.sh)
5. [`cxado.code-workspace`](file:///home/bbv/Desktop/cys_framework/cxado.code-workspace): folder `shared/gui`
6. [`AGENTS.md`](file:///home/bbv/Desktop/cys_framework/AGENTS.md) + README: строка про gui hub

**FSTEC dependency path после submodule:**

```json
"@cxado/gui": "file:../../cys_framework/shared/gui"
```

(или symlink `fstec/cxado-gui` → `cys_framework/shared/gui` для обратной совместимости с текущим `file:../cxado-gui`)

**Опционально (отдельный PR):** `projects/fstec` submodule в cys_framework.

---

### Wave Gui-1 — Самодостаточный пакет (2 PR, только cxado-gui)

**Цель:** `cd shared/gui && npm run typecheck` — green, 0 импортов `@/`.

| # | Задача | Действие |
|---|--------|----------|
| 1.1 | Fix columns path | `src/columns/columns/` → `src/columns/` |
| 1.2 | Generic chart types | Новый `src/lib/charts/types.ts`: `StatusDistribution`, `StatusBreakdownRow`, `ChartFilterScope` |
| 1.3 | Chart filters/visibility | Скопировать generic части из [lib/dashboard/chart-filters.ts](file:///home/bbv/Desktop/fstec/fstec/lib/dashboard/chart-filters.ts), [chart-visibility.ts](file:///home/bbv/Desktop/fstec/fstec/lib/dashboard/chart-visibility.ts) — без FSTEC types |
| 1.4 | Убрать FSTEC config | Удалить `src/lib/dashboard/presentation-config.ts`; charts принимают `presentation: CompliancePresentationConfig` |
| 1.5 | DataTableShell | Перенести из platform → `src/layout/data-table-shell.tsx` |
| 1.6 | FormSkeleton + FormErrorSlot | → `src/skeletons/form-skeleton.tsx`, `src/layout/form-error-slot.tsx` |
| 1.7 | Notify abstraction | `src/lib/ui/notify.ts` (thin sonner wrapper) |
| 1.8 | TrackedItemsTable | Props: `getDisplayStatus`, `isOverdue`, `labels` |
| 1.9 | Commentary attachments | `maxAttachments` prop вместо `lib/storage/config` |
| 1.10 | Timezone in data-table | `formatFilterValue(value, { timeZone? })` — optional |
| 1.11 | Dev deps | `npm install` peers as devDeps для typecheck |
| 1.12 | Sync script | `scripts/sync-from-fstec.sh` — односторонний copy + `rewrite-imports` |

**DoD:** `grep '@/' src` → 0; `npm run typecheck` green.

---

### Wave Gui-2 — Strangler re-exports в FSTEC (3 PR, низкий риск)

**Стратегия:** не менять 100+ импортов сразу — заменить **тела** каталогов на re-export из `@cxado/gui`.

**PR 2a — Tier 1 core:**

| FSTEC path | Становится |
|------------|------------|
| `components/ui/*.tsx` | `export * from "@cxado/gui/ui/..."` (или один barrel per file) |
| `components/motion/*` | re-export from `@cxado/gui/motion` |
| `components/shell/*` | re-export from `@cxado/gui/shell` |
| `components/theme-*.tsx` | re-export from `@cxado/gui/theme` |
| `hooks/use-mobile.ts`, `use-compact-shell.ts` | re-export |
| `lib/utils.ts` | `export { cn } from "@cxado/gui/utils"` |

**PR 2b — data-table + skeletons:**

- `components/data-table/*` → `@cxado/gui/data-table`
- `components/shared/skeletons/*` → `@cxado/gui/skeletons`

**PR 2c — tailwind:**

- [app/globals.css](file:///home/bbv/Desktop/fstec/fstec/app/globals.css): `@import "@cxado/gui/tailwind.preset.css"` + app-specific tokens only

**DoD:** `npm run typecheck && npm run lint && npm run build`; smoke `/panel`, `/p/{token}`.

---

### Wave Gui-3 — Tier 2 patterns (2 PR)

Re-export или migrate:

- `components/shared/{page-header,overflow-text,form-card-grid,form-actions-bar,share-link-*}` → `@cxado/gui/layout`
- `components/shared/commentary-attachments-field` → `@cxado/gui/forms`
- `components/dashboard/{chart-*,stacked-*}` → `@cxado/gui/charts`
- `lib/data-table/columns/*` → `@cxado/gui/columns` (FSTEC передаёт `FSTEC_TABLE_LABELS`)
- `components/shared/tracked-items-data-table` → `@cxado/gui/tables` + FSTEC wrapper `measures-data-table`

Добавить в gui (из аудита B): `form-error-slot`, `attachment-gallery`, `empty-table-state`.

---

### Wave Gui-4 — Tier 3 dashboard framework (3 PR)

**PR 4a — Generic dashboard lib в gui:**

- `src/lib/dashboard/period-range.ts` (UI-only, без server)
- `src/lib/dashboard/interactive-props.ts` (generic types)
- Досинкать недостающие 13 dashboard components

**PR 4b — ComplianceDashboard orchestrator:**

Расширить [ComplianceDashboard.tsx](file:///home/bbv/Desktop/fstec/cxado-gui/src/dashboard/ComplianceDashboard.tsx):

```ts
<ComplianceDashboard
  presentation={fstecCompliancePresentation}
  stats={stats}
  charts={<ScopedDashboardCharts ... />}
  matrix={<DashboardMatrixTable ... />}
/>
```

**PR 4c — FSTEC adapter wiring:**

- [lib/cxado-gui/fstec-adapter.ts](file:///home/bbv/Desktop/fstec/fstec/lib/cxado-gui/fstec-adapter.ts) — runtime import из `@cxado/gui/dashboard`
- `components/dashboard/*` → thin wrappers или re-exports
- `dashboard-matrix-section.tsx` **остаётся в FSTEC** (server fetch + cache)

---

### Wave Gui-5 — Документация и другие проекты

| Задача | Где |
|--------|-----|
| Обновить [ui-layers.md](file:///home/bbv/Desktop/fstec/fstec/docs/architecture/ui-layers.md) | FSTEC |
| `docs/gui-consumer.md` в cxado-gui | Как подключить Veil/Veneno |
| `make gui-link` для veil | cys_framework script |
| Master plan фазы 44–49 | [fstec_master.plan.md](file:///home/bbv/Desktop/fstec/fstec/docs/plans/fstec_master.plan.md) |

---

## Порядок веток

```
cxado-gui/main          ← Gui-0 init, Gui-1 decouple
cys_framework/main      ← Gui-0 submodule + Makefile
fstec/phase-44-gui-reexports-tier1   ← Gui-2a
fstec/phase-45-gui-reexports-tier1b  ← Gui-2b
fstec/phase-46-gui-tier2             ← Gui-3
fstec/phase-47-gui-dashboard         ← Gui-4
```

Каждая волна: typecheck + lint + build + dashboard smoke.

---

## Оценка

| Волна | PR | Риск | Результат |
|-------|-----|------|-----------|
| Gui-0 | 2 | Низкий | Repo + submodule в cys_framework |
| Gui-1 | 2 | Средний | Пакет компилируется standalone |
| Gui-2 | 3 | Низкий | FSTEC реально на @cxado/gui |
| Gui-3 | 2 | Средний | Patterns переиспользуемы в Veil |
| Gui-4 | 3 | Высокий | Dashboard framework + FSTEC adapter |
| Gui-5 | 1 | Низкий | Docs + multi-project |

**Итого:** ~13 PR, начиная с Gui-0 (репозиторий) — без блокировки на полную миграцию dashboard.

---

## Рекомендуемый старт

1. **Gui-0** — `git init` + push cxado-gui + submodule в `/home/bbv/Desktop/cys_framework/shared/gui`
2. **Gui-1** — убрать 52 `@/` зависимости (без этого пакет мёртвый)
3. **Gui-2a** — re-export `components/ui/*` (мгновенный win, 0 mass import rewrite)
