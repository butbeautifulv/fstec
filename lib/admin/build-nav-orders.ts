import type { LucideIcon } from "lucide-react"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"

type SidebarOrder = { id: number; title: string }

export function buildAdminOrdersNavItem(
  orders: SidebarOrder[],
  pathname: string,
  icon?: LucideIcon
): ShellNavMainItem {
  if (orders.length === 0) {
    return {
      title: "Поручения",
      href: "/admin/orders",
      icon,
      isActive: pathname.startsWith("/admin/orders"),
    }
  }

  return {
    title: "Поручения",
    icon,
    defaultOpen: pathname.startsWith("/admin/orders"),
    children: orders.map((order) => {
      const href = `/admin/orders/${order.id}`
      return {
        title: order.title,
        href,
        isActive: pathname === href || pathname.startsWith(`${href}/`),
      }
    }),
  }
}
