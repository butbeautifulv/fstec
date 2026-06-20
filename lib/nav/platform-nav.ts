import type { LucideIcon } from "lucide-react"
import {
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ShieldIcon,
} from "lucide-react"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"
import { Permission, type Permission as PermissionType } from "@/lib/auth/permissions"
import { labels } from "@/lib/ui/branding"

type NavDef = {
  title: string
  href: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  permission?: PermissionType
}

const NAV_DEFS: NavDef[] = [
  {
    title: "Сводка",
    href: "/panel",
    icon: LayoutDashboardIcon,
    match: (p) => p === "/panel",
    permission: Permission.ordersRead,
  },
  {
    title: "Меры",
    href: "/panel/measures",
    icon: ShieldIcon,
    match: (p) => p === "/panel/measures" || p.startsWith("/panel/measures/"),
    permission: Permission.measuresRead,
  },
  {
    title: "Поручения",
    href: "/panel/orders",
    icon: ClipboardListIcon,
    match: (p) => p === "/panel/orders" || p.startsWith("/panel/orders/"),
    permission: Permission.ordersRead,
  },
  {
    title: labels.orgs,
    href: "/panel/organizations",
    icon: Building2Icon,
    match: (p) => p === "/panel/organizations" || p.startsWith("/panel/organizations/"),
    permission: Permission.orgsRead,
  },
  {
    title: "Переносы",
    href: "/panel/delay-requests",
    icon: CalendarClockIcon,
    match: (p) => p.startsWith("/panel/delay-requests"),
    permission: Permission.delaysRead,
  },
  {
    title: "Отчёты",
    href: "/panel/responses",
    icon: FileTextIcon,
    match: (p) => p.startsWith("/panel/responses"),
    permission: Permission.ordersRead,
  },
]

export function buildPlatformNavItems(pathname: string): (ShellNavMainItem & {
  permission?: PermissionType
})[] {
  return NAV_DEFS.map((def) => ({
    title: def.title,
    href: def.href,
    icon: def.icon,
    isActive: def.match(pathname),
    permission: def.permission,
  }))
}

export function filterNavByPermission<T extends { permission?: PermissionType }>(
  items: T[],
  can: (permission: PermissionType) => boolean
): T[] {
  return items.filter((item) => !item.permission || can(item.permission))
}

export const PLATFORM_PRIMARY_ACTION = {
  href: "/panel/orders/new",
  label: "Создать поручение",
  permission: Permission.ordersWrite,
} as const

export const PLATFORM_BRAND_HREF = "/panel"
