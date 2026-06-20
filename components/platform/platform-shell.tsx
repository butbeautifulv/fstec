"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  PlatformBreadcrumb,
  PlatformBreadcrumbProvider,
} from "@/components/platform/platform-breadcrumb"
import type { PlatformSessionUser } from "@/lib/auth/platform-session"
import {
  PlatformSessionProvider,
} from "@/components/platform/platform-session-provider"
import { AppShell } from "@/components/shell/app-shell"

export function PlatformShell({
  children,
  initialUser,
  pendingDelays = 0,
  pendingResponses = 0,
}: {
  children: React.ReactNode
  initialUser?: PlatformSessionUser
  pendingDelays?: number
  pendingResponses?: number
}) {
  const shell = (
    <AppShell
      sidebar={
        <AppSidebar
          pendingDelays={pendingDelays}
          pendingResponses={pendingResponses}
        />
      }
      provider={PlatformBreadcrumbProvider}
      breadcrumb={<PlatformBreadcrumb />}
    >
      {children}
    </AppShell>
  )

  if (!initialUser) return shell

  return (
    <PlatformSessionProvider
      value={{
        me: initialUser,
        pendingDelays,
        pendingResponses,
      }}
    >
      {shell}
    </PlatformSessionProvider>
  )
}

