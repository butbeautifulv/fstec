import { afterEach, describe, expect, it, vi } from "vitest"

describe("email config", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("getAppBaseUrl defaults to localhost", async () => {
    const { getAppBaseUrl } = await import("@/lib/email/config")
    expect(getAppBaseUrl()).toBe("http://localhost:3000")
  })

  it("getAppBaseUrl reads APP_URL", async () => {
    vi.stubEnv("APP_URL", "https://fstec.example.com")
    const { getAppBaseUrl } = await import("@/lib/email/config")
    expect(getAppBaseUrl()).toBe("https://fstec.example.com")
  })

  it("getOperatorNotifyEmail prefers OPERATOR_NOTIFY_EMAIL", async () => {
    vi.stubEnv("OPERATOR_NOTIFY_EMAIL", "ops@example.com")
    const { getOperatorNotifyEmail } = await import("@/lib/email/config")
    expect(getOperatorNotifyEmail()).toBe("ops@example.com")
  })

  it("getOperatorNotifyEmail falls back to ADMIN_EMAIL", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
    const { getOperatorNotifyEmail } = await import("@/lib/email/config")
    expect(getOperatorNotifyEmail()).toBe("admin@example.com")
  })

  it("getOperatorNotifyEmail defaults when env unset", async () => {
    const { getOperatorNotifyEmail } = await import("@/lib/email/config")
    expect(getOperatorNotifyEmail()).toBe("admin@fstec.local")
  })

  it("isSmtpConfigured is false without SMTP_HOST", async () => {
    const { isSmtpConfigured } = await import("@/lib/email/config")
    expect(isSmtpConfigured()).toBe(false)
  })

  it("isSmtpConfigured is true when SMTP_HOST is set", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com")
    const { isSmtpConfigured } = await import("@/lib/email/config")
    expect(isSmtpConfigured()).toBe(true)
  })

  it("getSmtpConfig reads env with defaults", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com")
    vi.stubEnv("SMTP_PORT", "587")
    vi.stubEnv("SMTP_USER", "user")
    vi.stubEnv("SMTP_PASS", "pass")
    vi.stubEnv("SMTP_FROM", "noreply@example.com")
    const { getSmtpConfig } = await import("@/lib/email/config")
    expect(getSmtpConfig()).toEqual({
      host: "smtp.example.com",
      port: 587,
      user: "user",
      pass: "pass",
      from: "noreply@example.com",
    })
  })

  it("getSmtpConfig omits empty credentials and uses default port/from", async () => {
    const { getSmtpConfig } = await import("@/lib/email/config")
    expect(getSmtpConfig()).toEqual({
      host: undefined,
      port: 1025,
      user: undefined,
      pass: undefined,
      from: "noreply@fstec.local",
    })
  })

  it("getCronSecret returns trimmed secret", async () => {
    vi.stubEnv("CRON_SECRET", "  secret-value  ")
    const { getCronSecret } = await import("@/lib/email/config")
    expect(getCronSecret()).toBe("secret-value")
  })

  it("getCronSecret returns undefined when unset", async () => {
    const { getCronSecret } = await import("@/lib/email/config")
    expect(getCronSecret()).toBeUndefined()
  })
})
