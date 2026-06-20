"use client"

import { createContext, useContext } from "react"
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions"
import type { PlatformSessionUser } from "@/lib/auth/platform-session"

type PlatformSessionContextValue = {
  me: PlatformSessionUser
  pendingDelays: number
  pendingResponses: number
}

const PlatformSessionContext = createContext<PlatformSessionContextValue | null>(
  null
)

export function PlatformSessionProvider({
  value,
  children,
}: {
  value: PlatformSessionContextValue
  children: React.ReactNode
}) {
  return (
    <PlatformSessionContext.Provider value={value}>
      {children}
    </PlatformSessionContext.Provider>
  )
}

export function usePlatformSession() {
  const ctx = useContext(PlatformSessionContext)
  if (!ctx) {
    throw new Error("usePlatformSession must be used within PlatformSessionProvider")
  }
  return ctx
}

export function usePlatformUser() {
  const { me } = usePlatformSession()

  function can(permission: Permission) {
    return hasPermission(me.role, permission)
  }

  return { me, loading: false, can }
}

export type { PlatformSessionUser } from "@/lib/auth/platform-session"
