import type { SessionOptions } from "iron-session"
import type { UserRole } from "@prisma/client"

export interface SessionData {
  userId: number
  email: string
  role: UserRole
  isLoggedIn: boolean
  mustChangePassword: boolean
}

export const defaultSession: SessionData = {
  userId: 0,
  email: "",
  role: "VIEWER",
  isLoggedIn: false,
  mustChangePassword: false,
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be at least 32 characters")
  }
  return "development-secret-minimum-32-characters-long"
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: "fstec_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
}
