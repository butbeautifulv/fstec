"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  AdminBreadcrumb,
  AdminBreadcrumbProvider,
} from "@/components/admin/admin-breadcrumb"
import { AppShell } from "@/components/shell/app-shell"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={<AppSidebar />}
      provider={AdminBreadcrumbProvider}
      breadcrumb={<AdminBreadcrumb />}
    >
      {children}
    </AppShell>
  )
}
