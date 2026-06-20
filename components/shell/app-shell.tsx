"use client"

import { ThemeToggle } from "@/components/theme-toggle"
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
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        {breadcrumb}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
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
