import type { LucideIcon } from "lucide-react"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"

export function buildAdminOrdersNavItem(
  pathname: string,
  icon?: LucideIcon
): ShellNavMainItem {
  return {
    title: "Поручения",
    href: "/panel/orders",
    icon,
    isActive: pathname.startsWith("/panel/orders"),
  }
}
