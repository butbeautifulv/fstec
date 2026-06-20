import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { getDashboardMatrix } from "@/lib/orders"

export async function GET(request: Request) {
  try {
    await requirePermission(Permission.ordersRead)
    const overdueOnly = new URL(request.url).searchParams.get("overdue") === "1"
    let items = await getDashboardMatrix()
    if (overdueOnly) {
      items = items.filter((item) => item.isOverdue)
    }
    return jsonOk(items)
  } catch (error) {
    return handleApiError(error)
  }
}
