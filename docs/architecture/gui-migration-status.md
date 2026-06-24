# GUI migration status (paused)

Branch: `fstec/gui-detach-wip` — WIP snapshot; **not merged to `master`**.

## Done (phases 44–49)

- `@cxado/gui` package at `../cxado-gui` (`file:` dependency + tsconfig paths)
- Tier 1–2 strangler re-exports under `components/ui/`, `shell/`, `motion/`, `data-table/`, etc.
- Dashboard client components re-exported from `@cxado/gui/dashboard` with FSTEC `presentation` injection
- `lib/cxado-gui/fstec-adapter.ts`, `lib/dashboard/presentation-config.ts`
- [ui-layers.md](./ui-layers.md) boundary map

## Remaining before merge

| Item | Notes |
|------|-------|
| `globals.css` | Import `@cxado/gui/tailwind.preset.css` (documented in ui-layers but not wired on master WIP) |
| Dashboard tables | `dashboard-scoped-table.tsx`, hybrid `measures-data-table` / `tracked-items-data-table` |
| GUI source pin | Switch from sibling `../cxado-gui` to meta-repo `shared/gui` when tabula stabilizes |
| `npm run build` | Must be green on WIP branch before resuming |
| Tabula umbrella | Compliance domain structure before continuing in-repo detachment |

## Resume criteria

1. `shared/gui` submodule pinned and synced with `cxado-gui` main
2. Tabula domain scaffold (fstec as first module)
3. WIP branch rebased; consumer uses `file:../../shared/gui` or `make gui-link`

`master` stays on full in-repo UI until the above are met.
