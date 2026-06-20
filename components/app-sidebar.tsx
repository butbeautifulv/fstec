"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NavUser } from "@/components/nav-user"
import { useAdminMe } from "@/components/admin/use-admin-me"
import { ShellSidebar } from "@/components/shell/shell-sidebar"
import type { ShellNavMainItem } from "@/components/shell/shell-nav-main"
import { buildAdminOrdersNavItem } from "@/lib/admin/build-nav-orders"
import { APP_SIDEBAR_NAME, APP_TAGLINE, labels } from "@/lib/ui/branding"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { me } = useAdminMe()
  const [pendingDelays, setPendingDelays] = useState(0)

  useEffect(() => {
    void fetch("/api/delay-requests?count=pending")
      .then((r) => r.json())
      .then((data) => setPendingDelays(data.count ?? 0))
      .catch(() => setPendingDelays(0))
  }, [pathname])

  const navItems = useMemo<ShellNavMainItem[]>(
    () => [
      {
        title: "Сводка",
        href: "/admin",
        icon: LayoutDashboardIcon,
        isActive: pathname === "/admin",
      },
      {
        title: "Меры",
        href: "/admin/measures",
        icon: ShieldIcon,
        isActive: pathname === "/admin/measures" || pathname.startsWith("/admin/measures/"),
      },
      buildAdminOrdersNavItem(pathname, ClipboardListIcon),
      {
        title: labels.orgs,
        href: "/admin/organizations",
        icon: Building2Icon,
        isActive:
          pathname === "/admin/organizations" ||
          pathname.startsWith("/admin/organizations/"),
      },
      {
        title: "Переносы",
        href: "/admin/delay-requests",
        icon: CalendarClockIcon,
        isActive: pathname.startsWith("/admin/delay-requests"),
        badge:
          pendingDelays > 0 ? (
            <Badge variant="destructive" className="ml-auto shrink-0">
              {pendingDelays}
            </Badge>
          ) : undefined,
      },
    ],
    [pathname, pendingDelays]
  )

  const settingsActive = pathname.startsWith("/admin/settings")
  const showSettings = me != null

  return (
    <ShellSidebar
      variant="inset"
      groupLabel="Платформа"
      brand={{ href: "/admin", title: APP_SIDEBAR_NAME, subtitle: APP_TAGLINE, icon: ShieldIcon }}
      navItems={navItems}
      primaryAction={{
        href: "/admin/orders/new",
        label: "Создать поручение",
        icon: PlusIcon,
      }}
      footer={
        <>
          {showSettings && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={settingsActive} tooltip="Настройки">
                  <Link href="/admin/settings">
                    <SettingsIcon />
                    <span>Настройки</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
          <NavUser
            user={{
              name: me?.name ?? "Администратор",
              email: me?.email ?? "",
            }}
          />
        </>
      }
    />
  )
}
