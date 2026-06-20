import { notFound, redirect } from "next/navigation"
import {
  hasAnyPermission,
  normalizeRole,
  type Permission,
} from "@/lib/auth/permissions"
import { getSession, hydrateSessionRole } from "@/lib/auth/session"

export async function requirePageSession() {
  const session = await hydrateSessionRole(await getSession())
  if (!session.isLoggedIn || !normalizeRole(session.role)) {
    redirect("/login")
  }
  return session
}

export async function requirePagePermission(...permissions: Permission[]) {
  const session = await hydrateSessionRole(await getSession())
  if (!session.isLoggedIn || !normalizeRole(session.role)) {
    redirect("/login")
  }
  if (permissions.length && !hasAnyPermission(session.role, permissions)) {
    notFound()
  }
  return session
}
