import { invalidateDashboardCache } from "@/lib/dashboard/cache"
import type { DashboardScope } from "@/lib/dashboard/stats"

export async function invalidateDashboardOnMutation(scope?: DashboardScope) {
  await invalidateDashboardCache(scope)
}
