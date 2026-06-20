import type { LucideIcon } from "lucide-react"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"

export function buildAdminOrdersNavItem(
  pathname: string,
  icon?: LucideIcon
): ShellNavMainItem {
  return {
    title: "Поручения",
    href: "/admin/orders",
    icon,
    isActive: pathname.startsWith("/admin/orders"),
  }
}
