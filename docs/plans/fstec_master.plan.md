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

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard matrix |
| `/admin/measures` | Measure catalog |
| `/admin/orders` | Orders + link generation |
| `/admin/organizations` | ДЗО + subdivisions |
| `/admin/settings/statuses` | Status dictionary |
| `/p/[token]` | Public assignment page |
