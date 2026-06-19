import type { SessionOptions } from "iron-session"

export interface SessionData {
  userId: number
  email: string
  isLoggedIn: boolean
}

export const defaultSession: SessionData = {
  userId: 0,
  email: "",
  isLoggedIn: false,
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
