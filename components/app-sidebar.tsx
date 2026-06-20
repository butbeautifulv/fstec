"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { PlusIcon, SettingsIcon, ShieldIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NavUser } from "@/components/nav-user"
import { usePlatformUser } from "@/components/platform/use-platform-user"
import { ShellSidebar } from "@/components/shell/shell-sidebar"
import {
  buildPlatformNavItems,
  filterNavByPermission,
  PLATFORM_BRAND_HREF,
  PLATFORM_PRIMARY_ACTION,
} from "@/lib/nav/platform-nav"
import { ROLE_LABELS } from "@/lib/auth/permissions"
import { APP_SIDEBAR_NAME, APP_TAGLINE } from "@/lib/ui/branding"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { me, can } = usePlatformUser()
  const [pendingDelays, setPendingDelays] = useState(0)

  useEffect(() => {
    void fetch("/api/delay-requests?count=pending")
      .then((r) => r.json())
      .then((data) => setPendingDelays(data.count ?? 0))
      .catch(() => setPendingDelays(0))
  }, [pathname])

  const navItems = useMemo(() => {
    const items = filterNavByPermission(buildPlatformNavItems(pathname), can)
    return items.map((item) =>
      item.href === "/panel/delay-requests" && pendingDelays > 0
        ? {
            ...item,
            badge: (
              <Badge variant="destructive" className="ml-auto shrink-0">
                {pendingDelays}
              </Badge>
            ),
          }
        : item
    )
  }, [pathname, pendingDelays, can])

  const settingsActive = pathname.startsWith("/panel/settings")
  const showSettings = me != null
  const showPrimaryAction = can(PLATFORM_PRIMARY_ACTION.permission)
  const userLabel = me?.name ?? (me?.role ? ROLE_LABELS[me.role] : "Пользователь")

  return (
    <ShellSidebar
      variant="inset"
      groupLabel="Платформа"
      brand={{
        href: PLATFORM_BRAND_HREF,
        title: APP_SIDEBAR_NAME,
        subtitle: APP_TAGLINE,
        icon: ShieldIcon,
      }}
      navItems={navItems}
      primaryAction={
        showPrimaryAction
          ? {
              href: PLATFORM_PRIMARY_ACTION.href,
              label: PLATFORM_PRIMARY_ACTION.label,
              icon: PlusIcon,
            }
          : undefined
      }
      footer={
        <>
          {showSettings && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={settingsActive} tooltip="Настройки">
                  <Link href="/panel/settings">
                    <SettingsIcon />
                    <span>Настройки</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
          <NavUser
            user={{
              name: userLabel,
              email: me?.email ?? "",
            }}
          />
        </>
      }
    />
  )
}
