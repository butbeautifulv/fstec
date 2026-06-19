import { ClipboardListIcon, LayoutDashboardIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"
import { getDisplayStatusName, isOrderItemOverdue } from "@/lib/statuses/workflow"

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

export function buildPublicNavMainItems(
  token: string,
  orders: NavOrder[],
  pathname: string
): ShellNavMainItem[] {
  const now = new Date()
  const dashboardHref = `/p/${token}`
  const items: ShellNavMainItem[] = [
    {
      title: "Сводка",
      href: dashboardHref,
      icon: LayoutDashboardIcon,
      isActive: pathname === dashboardHref || pathname === `${dashboardHref}/`,
    },
  ]

  for (const order of orders) {
    if (order.items.length === 0) continue
    items.push({
      title: order.title,
      icon: ClipboardListIcon,
      defaultOpen: order.items.some((item) => pathname === `/p/${token}/items/${item.id}`),
      children: order.items.map((item) => {
        const row = { status: item.status, dueAt: item.dueAt }
        const href = `/p/${token}/items/${item.id}`
        return {
          title: item.measure.name,
          href,
          isActive: pathname === href,
          badge: (
            <Badge
              variant={isOrderItemOverdue(row, now) ? "destructive" : "secondary"}
              className="ml-auto shrink-0 text-[10px]"
            >
              {getDisplayStatusName(row, now)}
            </Badge>
          ),
        }
      }),
    })
  }

  return items
}
