import { beforeEach, describe, expect, it, vi } from "vitest"
import { Permission } from "@/lib/auth/permissions"

const mockRedirect = vi.hoisted(() => vi.fn())
const mockNotFound = vi.hoisted(() => vi.fn())
const mockGetSession = vi.hoisted(() => vi.fn())
const mockHydrateSessionRole = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}))

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
  hydrateSessionRole: mockHydrateSessionRole,
}))

mockRedirect.mockImplementation(() => {
  throw new Error("REDIRECT")
})
mockNotFound.mockImplementation(() => {
  throw new Error("NOT_FOUND")
})

import { requirePagePermission, requirePageSession } from "@/lib/auth/page-guard"

const loggedInSession = {
  isLoggedIn: true,
  role: "OPERATOR",
  userId: 1,
  email: "user@example.com",
}

describe("requirePageSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw new Error("REDIRECT")
    })
    mockNotFound.mockImplementation(() => {
      throw new Error("NOT_FOUND")
    })
    mockHydrateSessionRole.mockImplementation(async (session) => session)
  })

  it("redirects when not logged in", async () => {
    mockGetSession.mockResolvedValue({ isLoggedIn: false, role: null })
    await expect(requirePageSession()).rejects.toThrow("REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("redirects when role is missing", async () => {
    mockGetSession.mockResolvedValue({ isLoggedIn: true, role: null })
    await expect(requirePageSession()).rejects.toThrow("REDIRECT")
  })

  it("returns session when authenticated", async () => {
    mockGetSession.mockResolvedValue(loggedInSession)
    await expect(requirePageSession()).resolves.toEqual(loggedInSession)
  })
})

describe("requirePagePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw new Error("REDIRECT")
    })
    mockNotFound.mockImplementation(() => {
      throw new Error("NOT_FOUND")
    })
    mockHydrateSessionRole.mockImplementation(async (session) => session)
  })

  it("redirects when not logged in", async () => {
    mockGetSession.mockResolvedValue({ isLoggedIn: false, role: null })
    await expect(requirePagePermission(Permission.usersManage)).rejects.toThrow("REDIRECT")
  })

  it("returns session when permission granted", async () => {
    mockGetSession.mockResolvedValue({ ...loggedInSession, role: "SUPER_ADMIN" })
    await expect(requirePagePermission(Permission.usersManage)).resolves.toMatchObject({
      isLoggedIn: true,
      role: "SUPER_ADMIN",
    })
  })

  it("calls notFound when permission denied", async () => {
    mockGetSession.mockResolvedValue(loggedInSession)
    await expect(requirePagePermission(Permission.usersManage)).rejects.toThrow("NOT_FOUND")
    expect(mockNotFound).toHaveBeenCalled()
  })

  it("allows any authenticated user when no permissions specified", async () => {
    mockGetSession.mockResolvedValue(loggedInSession)
    await expect(requirePagePermission()).resolves.toEqual(loggedInSession)
  })
})
