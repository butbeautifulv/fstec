"use client"

import Link from "next/link"
import { useMemo } from "react"
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

export function AppSidebar({
  pendingDelays = 0,
  pendingResponses = 0,
}: {
  pendingDelays?: number
  pendingResponses?: number
}) {
  const pathname = usePathname()
  const { me, can } = usePlatformUser()

  const navItems = useMemo(() => {
    const items = filterNavByPermission(buildPlatformNavItems(pathname), can)
    return items.map((item) => {
      if (item.href === "/panel/delay-requests" && pendingDelays > 0) {
        return {
          ...item,
          badge: (
            <Badge variant="destructive" className="ml-auto shrink-0">
              {pendingDelays}
            </Badge>
          ),
        }
      }
      if (item.href === "/panel/responses" && pendingResponses > 0) {
        return {
          ...item,
          badge: (
            <Badge variant="destructive" className="ml-auto shrink-0">
              {pendingResponses}
            </Badge>
          ),
        }
      }
      return item
    })
  }, [pathname, pendingDelays, pendingResponses, can])

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
