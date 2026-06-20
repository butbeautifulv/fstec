import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { listSidebarOrders } from "@/lib/admin/sidebar-orders"
import { handleApiError, jsonOk } from "@/lib/api/errors"

export async function GET() {
  try {
    await requirePermission(Permission.ordersRead)
    const orders = await listSidebarOrders()
    return jsonOk(orders)
  } catch (error) {
    return handleApiError(error)
  }
}
