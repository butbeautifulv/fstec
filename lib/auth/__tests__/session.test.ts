import { beforeEach, describe, expect, it, vi } from "vitest"
import { Permission } from "@/lib/auth/permissions"
import { defaultSession } from "@/lib/auth/session-config"

const mockGetIronSession = vi.hoisted(() => vi.fn())
const mockCookies = vi.hoisted(() => vi.fn())
const mockGetUserById = vi.hoisted(() => vi.fn())

vi.mock("iron-session", () => ({
  getIronSession: mockGetIronSession,
}))

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}))

vi.mock("@/lib/users", () => ({
  getUserById: mockGetUserById,
}))

import {
  getSession,
  hydrateSessionRole,
  requireAdminSession,
  requireAuthenticatedSession,
  requirePermission,
} from "@/lib/auth/session"

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    ...defaultSession,
    isLoggedIn: true,
    userId: 1,
    email: "user@example.com",
    role: "OPERATOR",
    mustChangePassword: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe("getSession", () => {
  it("delegates to iron-session with cookies", async () => {
    const session = makeSession()
    mockCookies.mockResolvedValue({})
    mockGetIronSession.mockResolvedValue(session)

    expect(await getSession()).toBe(session)
    expect(mockGetIronSession).toHaveBeenCalled()
  })
})

describe("hydrateSessionRole", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns session unchanged when fully hydrated", async () => {
    const session = makeSession()
    const result = await hydrateSessionRole(session as never)
    expect(result).toBe(session)
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it("returns session unchanged when logged out", async () => {
    const session = makeSession({ isLoggedIn: false, userId: 0, role: undefined })
    const result = await hydrateSessionRole(session as never)
    expect(result).toBe(session)
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it("hydrates missing role from db", async () => {
    const session = makeSession({ role: undefined, mustChangePassword: undefined })
    mockGetUserById.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      role: "VIEWER",
      mustChangePassword: true,
    })

    const result = await hydrateSessionRole(session as never)
    expect(result.role).toBe("VIEWER")
    expect(result.mustChangePassword).toBe(true)
    expect(session.save).toHaveBeenCalled()
  })

  it("clears session when user missing", async () => {
    const session = makeSession({ role: undefined })
    mockGetUserById.mockResolvedValue(null)

    const result = await hydrateSessionRole(session as never)
    expect(result.isLoggedIn).toBe(false)
    expect(result.userId).toBe(0)
    expect(session.save).toHaveBeenCalled()
  })
})

describe("requireAuthenticatedSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({})
  })

  it("throws UNAUTHORIZED when not logged in", async () => {
    mockGetIronSession.mockResolvedValue(defaultSession)
    await expect(requireAuthenticatedSession()).rejects.toThrow("UNAUTHORIZED")
  })

  it("returns session when authenticated", async () => {
    const session = makeSession()
    mockGetIronSession.mockResolvedValue(session)
    expect(await requireAuthenticatedSession()).toEqual(session)
  })
})

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({})
  })

  it("delegates to requireAuthenticatedSession", async () => {
    const session = makeSession()
    mockGetIronSession.mockResolvedValue(session)
    expect(await requireAdminSession()).toEqual(session)
  })
})

describe("requirePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({})
  })

  it("throws FORBIDDEN when permission missing", async () => {
    mockGetIronSession.mockResolvedValue(makeSession({ role: "VIEWER" }))
    await expect(requirePermission(Permission.settingsWrite)).rejects.toThrow("FORBIDDEN")
  })

  it("returns session when permission granted", async () => {
    const session = makeSession({ role: "SUPER_ADMIN" })
    mockGetIronSession.mockResolvedValue(session)
    expect(await requirePermission(Permission.settingsWrite)).toEqual(session)
  })

  it("returns session when no permissions requested", async () => {
    const session = makeSession({ role: "VIEWER" })
    mockGetIronSession.mockResolvedValue(session)
    expect(await requirePermission()).toEqual(session)
  })
})
