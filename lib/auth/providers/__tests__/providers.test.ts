import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"
import * as password from "@/lib/auth/password"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockedPrisma = mocks.prisma

import { activeDirectoryAuthProvider } from "@/lib/auth/providers/active-directory"
import { getKeycloakLoginUrl, keycloakAuthProvider } from "@/lib/auth/providers/keycloak"
import { localAuthProvider } from "@/lib/auth/providers/local"

describe("localAuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getStatus reports configured local auth", () => {
    const status = localAuthProvider.getStatus()
    expect(status).toMatchObject({
      id: "local",
      configured: true,
      requiredEnv: [],
    })
  })

  it("rejects unknown user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null)
    const result = await localAuthProvider.authenticate({
      email: "missing@example.com",
      password: "password",
    })
    expect(result).toEqual({
      ok: false,
      error: "Invalid email or password",
      status: 401,
    })
  })

  it("rejects wrong password", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      name: "User",
      role: "OPERATOR",
      passwordHash: "hash",
      mustChangePassword: false,
    })
    vi.spyOn(password, "verifyPassword").mockResolvedValue(false)

    const result = await localAuthProvider.authenticate({
      email: "user@example.com",
      password: "wrong",
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(401)
    }
  })

  it("authenticates valid credentials", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: "user@example.com",
      name: "User",
      role: "VIEWER",
      passwordHash: "hash",
      mustChangePassword: true,
    })
    vi.spyOn(password, "verifyPassword").mockResolvedValue(true)

    const result = await localAuthProvider.authenticate({
      email: "user@example.com",
      password: "correct",
    })
    expect(result).toEqual({
      ok: true,
      user: {
        id: 7,
        email: "user@example.com",
        name: "User",
        role: "VIEWER",
        mustChangePassword: true,
      },
    })
  })
})

describe("activeDirectoryAuthProvider.getStatus", () => {
  it("reports not configured without env", () => {
    const status = activeDirectoryAuthProvider.getStatus()
    expect(status.configured).toBe(false)
    expect(status.requiredEnv).toEqual(["AD_LDAP_URL", "AD_BASE_DN"])
  })

  it("reports configured when env is set", () => {
    vi.stubEnv("AD_LDAP_URL", "ldap://ad.example.com")
    vi.stubEnv("AD_BASE_DN", "dc=example,dc=com")
    const status = activeDirectoryAuthProvider.getStatus()
    expect(status.configured).toBe(true)
  })

  it("authenticate returns 501 when not configured", async () => {
    const result = await activeDirectoryAuthProvider.authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(result).toMatchObject({
      ok: false,
      status: 501,
      error: "Active Directory integration is not configured",
    })
  })

  it("authenticate returns 501 when configured", async () => {
    vi.stubEnv("AD_LDAP_URL", "ldap://ad.example.com")
    vi.stubEnv("AD_BASE_DN", "dc=example,dc=com")
    const result = await activeDirectoryAuthProvider.authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(result).toMatchObject({
      ok: false,
      status: 501,
      error: "Active Directory authentication is not implemented yet",
    })
  })
})

describe("keycloakAuthProvider.getStatus", () => {
  it("reports not configured without env", () => {
    const status = keycloakAuthProvider.getStatus()
    expect(status.configured).toBe(false)
    expect(status.requiredEnv).toEqual([
      "KEYCLOAK_ISSUER",
      "KEYCLOAK_CLIENT_ID",
      "KEYCLOAK_CLIENT_SECRET",
    ])
  })

  it("reports configured when env is set", () => {
    vi.stubEnv("KEYCLOAK_ISSUER", "https://auth.example.com/realms/fstec")
    vi.stubEnv("KEYCLOAK_CLIENT_ID", "fstec-app")
    vi.stubEnv("KEYCLOAK_CLIENT_SECRET", "secret")
    const status = keycloakAuthProvider.getStatus()
    expect(status.configured).toBe(true)
  })

  it("authenticate returns 501 when not configured", async () => {
    const result = await keycloakAuthProvider.authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(result).toMatchObject({
      ok: false,
      status: 501,
      error: "Keycloak integration is not configured",
    })
  })

  it("authenticate returns 501 when configured", async () => {
    vi.stubEnv("KEYCLOAK_ISSUER", "https://auth.example.com/realms/fstec")
    vi.stubEnv("KEYCLOAK_CLIENT_ID", "fstec-app")
    vi.stubEnv("KEYCLOAK_CLIENT_SECRET", "secret")
    const result = await keycloakAuthProvider.authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(result).toMatchObject({
      ok: false,
      status: 501,
      error: "Keycloak authentication is not implemented yet",
    })
  })
})

describe("getKeycloakLoginUrl", () => {
  it("returns null when issuer or client id missing", () => {
    expect(getKeycloakLoginUrl()).toBeNull()
  })

  it("builds login URL with default redirect uri", () => {
    vi.stubEnv("KEYCLOAK_ISSUER", "https://auth.example.com/realms/fstec/")
    vi.stubEnv("KEYCLOAK_CLIENT_ID", "fstec-app")
    const url = getKeycloakLoginUrl()
    expect(url).toContain("https://auth.example.com/realms/fstec/protocol/openid-connect/auth")
    expect(url).toContain("client_id=fstec-app")
    expect(url).toContain(
      encodeURIComponent("http://localhost:3000/api/auth/keycloak/callback")
    )
  })

  it("uses custom redirect uri from env", () => {
    vi.stubEnv("KEYCLOAK_ISSUER", "https://auth.example.com/realms/fstec")
    vi.stubEnv("KEYCLOAK_CLIENT_ID", "fstec-app")
    vi.stubEnv("KEYCLOAK_REDIRECT_URI", "https://app.example.com/callback")
    const url = getKeycloakLoginUrl()
    expect(url).toContain(encodeURIComponent("https://app.example.com/callback"))
  })
})
