"use client"

import { usePathname } from "next/navigation"
import { LayoutDashboardIcon, ShieldIcon } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { ShellSidebar, type ShellSidebarLink } from "@/components/shell/shell-sidebar"
import type { ShellNavOrder } from "@/components/shell/shell-nav-groups"
import {
  PublicBreadcrumb,
  PublicBreadcrumbProvider,
} from "@/components/public/public-breadcrumb"
import { APP_NAME } from "@/lib/ui/branding"

type PublicShellContextValue = {
  token: string
  organizationName: string
  subdivisionName: string | null
  navOrders: ShellNavOrder[]
}

function PublicSidebar({
  token,
  organizationName,
  subdivisionName,
  navOrders,
}: PublicShellContextValue) {
  const pathname = usePathname()
  const links: ShellSidebarLink[] = [
    { href: `/p/${token}`, label: "Сводка", icon: LayoutDashboardIcon },
  ]

  return (
    <ShellSidebar
      variant="inset"
      brand={{
        href: `/p/${token}`,
        title: organizationName,
        subtitle: subdivisionName ?? APP_NAME,
        icon: ShieldIcon,
      }}
      links={links}
      pathname={pathname}
      navOrders={navOrders}
      isLinkActive={(link, path) => {
        if (link.href === `/p/${token}`) {
          return path === `/p/${token}` || path === `/p/${token}/`
        }
        return path === link.href || path.startsWith(`${link.href}/`)
      }}
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
