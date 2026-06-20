"use client"

import { PublicBreadcrumbLabel } from "@/components/public/public-breadcrumb-effect"

export function PublicReportsPageClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicBreadcrumbLabel label="Отчёты" />
      {children}
    </>
  )
}
