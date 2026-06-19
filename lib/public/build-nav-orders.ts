import { getDisplayStatusName, isOrderItemOverdue } from "@/lib/statuses/workflow"
import type { ShellNavOrder } from "@/components/shell/shell-nav-groups"

type NavItem = {
  id: number
  dueAt: Date
  measure: { name: string }
  status: { name: string; isTerminal: boolean }
}

type NavOrder = {
  title: string
  items: NavItem[]
}

export function buildPublicNavOrders(token: string, orders: NavOrder[]): ShellNavOrder[] {
  const now = new Date()
  return orders.map((order) => ({
    title: order.title,
    items: order.items.map((item) => {
      const row = { status: item.status, dueAt: item.dueAt }
      return {
        id: item.id,
        measureName: item.measure.name,
        displayStatus: getDisplayStatusName(row, now),
        isOverdue: isOrderItemOverdue(row, now),
        href: `/p/${token}/items/${item.id}`,
      }
    }),
  }))
}
