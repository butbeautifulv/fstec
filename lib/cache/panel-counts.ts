import "server-only"

import { getCachedJson } from "@/lib/cache/json-cache"
import { getDashboardCacheTtl } from "@/lib/cache/redis"
import { countPendingDelayRequests } from "@/lib/delays"
import { countPendingResponses } from "@/lib/responses"

export function getCachedPendingDelayCount() {
  return getCachedJson(
    "panel:pending:delays",
    getDashboardCacheTtl(),
    countPendingDelayRequests
  )
}

export function getCachedPendingResponseCount() {
  return getCachedJson(
    "panel:pending:responses",
    getDashboardCacheTtl(),
    countPendingResponses
  )
}
