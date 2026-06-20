import { ClipboardListIcon, LayoutDashboardIcon } from "lucide-react"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"

type NavOrder = {
  items: { id: number }[]
}

export function buildPublicNavMainItems(
  token: string,
  orders: NavOrder[],
  pathname: string
): ShellNavMainItem[] {
  const dashboardHref = `/p/${token}`
  const items: ShellNavMainItem[] = [
    {
      title: "Сводка",
      href: dashboardHref,
      icon: LayoutDashboardIcon,
      isActive: pathname === dashboardHref || pathname === `${dashboardHref}/`,
    },
  ]

  const hasOrders = orders.some((order) => order.items.length > 0)
  if (hasOrders) {
    const ordersHref = `/p/${token}/orders`
    items.push({
      title: "Поручения",
      href: ordersHref,
      icon: ClipboardListIcon,
      isActive: pathname.startsWith(ordersHref),
    })
  }

  return items
}
