"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { ShieldIcon } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { ShellSidebar } from "@/components/shell/shell-sidebar"
import {
  PublicBreadcrumb,
  PublicBreadcrumbProvider,
} from "@/components/public/public-breadcrumb"
import { buildPublicNavMainItems } from "@/lib/public/build-public-nav-main"
import {
  formatPublicBrandSubtitle,
  formatPublicBrandTitle,
  formatPublicBrandTooltip,
} from "@/lib/ui/sidebar-brand"

type PublicNavOrder = {
  id: number
  title: string
  items: {
    id: number
    dueAt: Date
    measure: { name: string }
    status: { name: string; isTerminal: boolean }
  }[]
}

type PublicShellContextValue = {
  token: string
  organizationName: string
  subdivisionName: string | null
  navOrders: PublicNavOrder[]
}

function PublicSidebar({
  token,
  organizationName,
  subdivisionName,
  navOrders,
}: PublicShellContextValue) {
  const pathname = usePathname()
  const navItems = useMemo(
    () => buildPublicNavMainItems(token, navOrders, pathname),
    [token, navOrders, pathname]
  )
  const subtitle = formatPublicBrandSubtitle(organizationName, subdivisionName)

  return (
    <ShellSidebar
      variant="inset"
      groupLabel="Навигация"
      brand={{
        href: `/p/${token}`,
        title: formatPublicBrandTitle(),
        subtitle,
        subtitleTitle: formatPublicBrandTooltip(organizationName, subdivisionName),
        icon: ShieldIcon,
      }}
      navItems={navItems}
    />
  )
}

export function PublicShell({
  token,
  organizationName,
  subdivisionName,
  navOrders,
  children,
}: PublicShellContextValue & { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={
        <PublicSidebar
          token={token}
          organizationName={organizationName}
          subdivisionName={subdivisionName}
          navOrders={navOrders}
        />
      }
      provider={PublicBreadcrumbProvider}
      breadcrumb={<PublicBreadcrumb organizationName={organizationName} />}
    >
      {children}
    </AppShell>
  )
}
