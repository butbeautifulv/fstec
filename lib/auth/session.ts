import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "./session-config"

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireAdminSession(): Promise<SessionData> {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

export { defaultSession, type SessionData }
