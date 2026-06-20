import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/auth/session-config"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/panel/login") {
    const loginUrl = new URL("/login", request.url)
    const next = request.nextUrl.searchParams.get("next")
    if (next) loginUrl.searchParams.set("next", next)
    return NextResponse.redirect(loginUrl)
  }

  if (!pathname.startsWith("/panel")) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (
    session.mustChangePassword &&
    pathname !== "/panel/change-password" &&
    !pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.redirect(new URL("/panel/change-password", request.url))
  }

  return response
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
}
