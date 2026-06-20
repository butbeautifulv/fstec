# FSTEC Master Plan

## Overview

Full-stack Next.js app for FSTEC security measures tracking across subsidiaries (ДЗО).

## Data model

- **Catalog:** `measures` (no status/deadline)
- **Execution:** `orders` → `order_items` (status + due_at per org)
- **Access:** `access_links` (token → order)
- **Feedback:** `responses`, `delay_requests` on `order_items`

## Phase status

| Phase | Branch | Status |
|-------|--------|--------|
| 00-docker-env | fstec/phase-00-docker-env | done |
| 01-prisma-core | fstec/phase-01-prisma-core | done |
| 02-prisma-workflow | fstec/phase-02-prisma-workflow | done |
| 03-seed-db-client | fstec/phase-03-seed-db-client | done |
| 04-agent-docs | fstec/phase-04-agent-docs | done |
| 05-auth-lib | fstec/phase-05-auth-lib | done |
| 06-auth-api-mw | fstec/phase-06-auth-api-mw | done |
| 07-admin-shell | fstec/phase-07-admin-shell | done |
| 08-orgs-api-ui | fstec/phase-08-orgs-api-ui | done |
| 09-statuses-api-ui | fstec/phase-09-statuses-api-ui | done |
| 10-measures-api | fstec/phase-10-measures-api | done |
| 11-measures-ui | fstec/phase-11-measures-ui | done |
| 12-orders-lib-api | fstec/phase-12-orders-lib-api | done |
| 13-orders-ui | fstec/phase-13-orders-ui | done |
| 14-access-links | fstec/phase-14-access-links | done |
| 15-public-read | fstec/phase-15-public-read | done |
| 16-public-status | fstec/phase-16-public-status | done |
| 17-public-response | fstec/phase-17-public-response | done |
| 18-public-delay | fstec/phase-18-public-delay | done |
| 19-dashboard | fstec/phase-19-dashboard | done |
| 20-polish | fstec/phase-20-polish | done |
| 21-dashboard-filters | fstec/phase-21-dashboard-filters | done |
| 22-chart-polish | fstec/phase-22-chart-polish | done |
| 23-delays-context | fstec/phase-23-delays-context | done |
| 24-dashboard-shell | fstec/phase-24-dashboard-shell | done |
| 25-shared-ui | fstec/phase-25-shared-ui | done |
| 26-crud-delete-hook | fstec/phase-26-crud-delete-hook | done |
| 27-crud-tables | fstec/phase-27-crud-tables | done |
| 28-nav-rbac | fstec/phase-28-nav-rbac | done |
| 29-panel-urls | fstec/phase-29-panel-urls | done |
| 30-platform-rename | fstec/phase-30-platform-rename | done |

## RBAC

Roles: `SUPER_ADMIN`, `OPERATOR`, `VIEWER` — permissions in `lib/auth/permissions.ts`. Platform nav and create actions gated by permission; API enforced via `requirePermission`.

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Login |
| `/panel` | Dashboard (KPI + charts + matrix) |
| `/panel/measures` | Measure catalog |
| `/panel/orders` | Orders |
| `/panel/organizations` | Organizations + subdivisions |
| `/panel/delay-requests` | Delay requests |
| `/panel/settings` | Settings hub (RBAC) |
| `/panel/change-password` | Forced password change |
| `/p/[token]` | Public assignment page |
