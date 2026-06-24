# GUI migration status

Branch: `fstec/gui-detach-wip` — **in progress**; not merged to `master`.

## Done (phases 44–49)

- `@cxado/gui` strangler re-exports under `components/ui/`, `shell/`, `motion/`, `data-table/`, etc.
- Dashboard client components re-exported from `@cxado/gui/dashboard` with FSTEC `presentation` injection
- `lib/cxado-gui/fstec-adapter.ts`, `lib/dashboard/presentation-config.ts`
- [ui-layers.md](./ui-layers.md) boundary map

## Phase 51 — shared/gui hub (in progress)

| Item | Status |
|------|--------|
| Tabula umbrella | done — `projects/tabula/fstec` in cxado |
| GUI source | `file:../../../shared/gui` (cxado `shared/gui` @ `87e6e6d`) |
| `globals.css` | `@import "@cxado/gui/tailwind.preset.css"` |
| Dashboard tables | hybrid wrappers: `dashboard-scoped-table`, `measures-data-table` → `@cxado/gui` |
| `npm run build` | verify on WIP before merge |

## Remaining before merge to master

- Green CI + critic review on WIP branch
- Optional: `make gui-link` symlink path for local dev without `file:` reinstall

`master` stays on full in-repo UI until merge criteria are met.
