import { getIronSession, type IronSession } from "iron-session"
import { cookies } from "next/headers"
import {
  hasAnyPermission,
  normalizeRole,
  type Permission,
} from "@/lib/auth/permissions"
import { getUserById } from "@/lib/users"
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "./session-config"

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

/** Backfill session fields from DB for legacy cookies or stale flags. */
export async function hydrateSessionRole(
  session: IronSession<SessionData>
): Promise<IronSession<SessionData>> {
  if (!session.isLoggedIn || !session.userId) return session

  const needsHydration =
    !normalizeRole(session.role) || session.mustChangePassword === undefined

  if (!needsHydration) return session

  const user = await getUserById(session.userId)
  if (!user) {
    session.isLoggedIn = false
    session.userId = 0
    session.email = ""
    session.role = defaultSession.role
    session.mustChangePassword = false
    await session.save()
    return session
  }

  session.role = user.role
  session.email = user.email
  session.mustChangePassword = user.mustChangePassword
  await session.save()
  return session
}

export async function requireAdminSession(): Promise<SessionData> {
  return requireAuthenticatedSession()
}

export async function requireAuthenticatedSession(): Promise<SessionData> {
  const session = await hydrateSessionRole(await getSession())
  if (!session.isLoggedIn || !session.userId || !normalizeRole(session.role)) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

export async function requirePermission(
  ...permissions: Permission[]
): Promise<SessionData> {
  const session = await requireAuthenticatedSession()
  if (!permissions.length || hasAnyPermission(session.role, permissions)) {
    return session
  }
  throw new Error("FORBIDDEN")
}

export { defaultSession, type SessionData }
