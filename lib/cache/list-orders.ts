import "server-only"

import { getCachedJson } from "@/lib/cache/json-cache"
import { getDashboardCacheTtl } from "@/lib/cache/redis"
import { listOrders } from "@/lib/orders"

export function getCachedListOrders() {
  return getCachedJson("list:orders", getDashboardCacheTtl(), listOrders)
}
