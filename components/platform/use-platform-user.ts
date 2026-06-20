"use client"

import { useEffect, useState } from "react"
import type { UserRole } from "@prisma/client"
import type { Permission } from "@/lib/auth/permissions"
import { hasPermission } from "@/lib/auth/permissions"

type MeResponse = {
  id: number
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
}

export function usePlatformUser() {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeResponse | null) => {
        if (!cancelled) setMe(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function can(permission: Permission) {
    return me ? hasPermission(me.role, permission) : false
  }

  return { me, loading, can }
}

/** @deprecated Use usePlatformUser */
export const useAdminMe = usePlatformUser
