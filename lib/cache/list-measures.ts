import "server-only"

import { getCachedJson } from "@/lib/cache/json-cache"
import { getDashboardCacheTtl } from "@/lib/cache/redis"
import { listMeasures } from "@/lib/measures"

export function getCachedListMeasures() {
  return getCachedJson("list:measures", getDashboardCacheTtl(), listMeasures)
}
