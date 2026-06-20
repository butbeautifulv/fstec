"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarAutoCollapse } from "@/components/shell/sidebar-auto-collapse"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function AppShell({
  sidebar,
  breadcrumb,
  provider: Provider,
  children,
}: {
  sidebar: React.ReactNode
  breadcrumb: React.ReactNode
  provider?: React.ComponentType<{ children: React.ReactNode }>
  children: React.ReactNode
}) {
  const body = (
    <>
      <SidebarAutoCollapse />
      <header className="flex h-(--header-height) min-w-0 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <div className="min-w-0 flex-1">{breadcrumb}</div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      <div className="@container/main flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {children}
      </div>
    </>
  )

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 88)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {sidebar}
      <SidebarInset>{Provider ? <Provider>{body}</Provider> : body}</SidebarInset>
    </SidebarProvider>
  )
}
