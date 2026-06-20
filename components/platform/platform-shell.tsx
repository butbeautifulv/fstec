"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  PlatformBreadcrumb,
  PlatformBreadcrumbProvider,
} from "@/components/platform/platform-breadcrumb"
import { AppShell } from "@/components/shell/app-shell"

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={<AppSidebar />}
      provider={PlatformBreadcrumbProvider}
      breadcrumb={<PlatformBreadcrumb />}
    >
      {children}
    </AppShell>
  )
}

/** @deprecated Use PlatformShell */
export const AdminShell = PlatformShell
