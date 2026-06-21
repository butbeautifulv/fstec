import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("auth providers index", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("defaults to local provider", async () => {
    const { getAuthProviderId, getAuthProvider } = await import("@/lib/auth/providers")
    expect(getAuthProviderId()).toBe("local")
    expect(getAuthProvider().id).toBe("local")
  })

  it("reads AUTH_PROVIDER from env", async () => {
    vi.stubEnv("AUTH_PROVIDER", "keycloak")
    const { getAuthProviderId, getAuthProvider } = await import("@/lib/auth/providers")
    expect(getAuthProviderId()).toBe("keycloak")
    expect(getAuthProvider().id).toBe("keycloak")
  })

  it("falls back to local for unknown AUTH_PROVIDER", async () => {
    vi.stubEnv("AUTH_PROVIDER", "unknown")
    const { getAuthProviderId } = await import("@/lib/auth/providers")
    expect(getAuthProviderId()).toBe("local")
  })

  it("authProvidersPayload includes active provider and statuses", async () => {
    vi.stubEnv("AUTH_PROVIDER", "active_directory")
    const { authProvidersPayload } = await import("@/lib/auth/providers")
    const payload = authProvidersPayload()
    expect(payload.activeProvider).toBe("active_directory")
    expect(payload.activeStatus.id).toBe("active_directory")
    expect(payload.providers).toHaveLength(3)
    expect(payload.providers.map((p) => p.id)).toEqual([
      "local",
      "active_directory",
      "keycloak",
    ])
  })

  it("active directory authenticate returns 501 when not configured", async () => {
    vi.stubEnv("AUTH_PROVIDER", "active_directory")
    const { getAuthProvider } = await import("@/lib/auth/providers")
    const result = await getAuthProvider().authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(result).toMatchObject({
      ok: false,
      status: 501,
      error: "Active Directory integration is not configured",
    })
  })

  it("active directory authenticate returns 501 when configured", async () => {
    vi.stubEnv("AUTH_PROVIDER", "active_directory")
    vi.stubEnv("AD_LDAP_URL", "ldap://ad.example.com")
    vi.stubEnv("AD_BASE_DN", "dc=example,dc=com")
    const { activeDirectoryAuthProvider } = await import("@/lib/auth/providers/active-directory")
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

  it("keycloak authenticate returns 501", async () => {
    vi.stubEnv("AUTH_PROVIDER", "keycloak")
    const { keycloakAuthProvider } = await import("@/lib/auth/providers/keycloak")
    const unconfigured = await keycloakAuthProvider.authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(unconfigured).toMatchObject({
      ok: false,
      status: 501,
      error: "Keycloak integration is not configured",
    })

    vi.stubEnv("KEYCLOAK_ISSUER", "https://auth.example.com/realms/fstec")
    vi.stubEnv("KEYCLOAK_CLIENT_ID", "fstec-app")
    vi.stubEnv("KEYCLOAK_CLIENT_SECRET", "secret")
    vi.resetModules()
    const { keycloakAuthProvider: configuredKeycloak } = await import(
      "@/lib/auth/providers/keycloak"
    )
    const configured = await configuredKeycloak.authenticate({
      email: "user@example.com",
      password: "secret",
    })
    expect(configured).toMatchObject({
      ok: false,
      status: 501,
      error: "Keycloak authentication is not implemented yet",
    })
  })
})
