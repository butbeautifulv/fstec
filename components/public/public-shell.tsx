"use client"

import { ShieldIcon } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { ShellSidebar } from "@/components/shell/shell-sidebar"
import {
  PublicBreadcrumb,
  PublicBreadcrumbProvider,
} from "@/components/public/public-breadcrumb"
import {
  formatPublicBrandSubtitle,
  formatPublicBrandTitle,
  formatPublicBrandTooltip,
} from "@/lib/ui/sidebar-brand"

type PublicShellProps = {
  token: string
  organizationName: string
  subdivisionName: string | null
  navContent: React.ReactNode
  children: React.ReactNode
}

export function PublicShell({
  token,
  organizationName,
  subdivisionName,
  navContent,
  children,
}: PublicShellProps) {
  const subtitle = formatPublicBrandSubtitle(organizationName, subdivisionName)

  return (
    <AppShell
      sidebar={
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
          navContent={navContent}
        />
      }
      provider={PublicBreadcrumbProvider}
      breadcrumb={<PublicBreadcrumb organizationName={organizationName} />}
    >
      {children}
    </AppShell>
  )
}
