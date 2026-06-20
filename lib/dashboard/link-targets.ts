import type { DashboardMatrixLinkTargets } from "@/components/dashboard/dashboard-matrix-table"
import type { DashboardMatrixRow } from "@/lib/dashboard/serialize-dashboard"

export function dashboardMatrixLinkTargets(
  variant: "platform" | "report",
  token?: string
): DashboardMatrixLinkTargets {
  if (variant === "platform") {
    return {
      organization: (orgId) => `/panel/organizations/${orgId}`,
      order: (orderId) => `/panel/orders/${orderId}`,
      measure: (row) => `/panel/measures/${row.measure.id}/edit`,
    }
  }

  if (!token) {
    throw new Error("Report dashboard matrix requires token")
  }

  return {
    organization: (orgId) => `/report/${token}/organizations/${orgId}`,
    order: (orderId) => `/report/${token}/orders/${orderId}`,
    measure: (row: DashboardMatrixRow) => `/report/${token}/items/${row.id}`,
  }
}
