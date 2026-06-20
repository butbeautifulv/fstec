import type { AuthCredentials, AuthProvider, AuthResult, AuthProviderStatus } from "./types"

const REQUIRED_ENV = [
  "KEYCLOAK_ISSUER",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_CLIENT_SECRET",
] as const

function isConfigured() {
  return REQUIRED_ENV.every((key) => Boolean(process.env[key]?.trim()))
}

export const keycloakAuthProvider: AuthProvider = {
  id: "keycloak",
  label: "Keycloak",

  async authenticate(_credentials: AuthCredentials): Promise<AuthResult> {
    if (!isConfigured()) {
      return {
        ok: false,
        error: "Keycloak integration is not configured",
        status: 501,
      }
    }
    return {
      ok: false,
      error: "Keycloak authentication is not implemented yet",
      status: 501,
    }
  },

  getStatus(): AuthProviderStatus {
    const configured = isConfigured()
    return {
      id: "keycloak",
      label: "Keycloak",
      configured,
      message: configured
        ? "Параметры OIDC заданы; вход через Keycloak будет подключён в следующей версии"
        : "Укажите KEYCLOAK_ISSUER, KEYCLOAK_CLIENT_ID и KEYCLOAK_CLIENT_SECRET",
      requiredEnv: [...REQUIRED_ENV],
    }
  },
}

export function getKeycloakLoginUrl(): string | null {
  const issuer = process.env.KEYCLOAK_ISSUER?.replace(/\/$/, "")
  const clientId = process.env.KEYCLOAK_CLIENT_ID
  if (!issuer || !clientId) return null
  const redirectUri = encodeURIComponent(
    process.env.KEYCLOAK_REDIRECT_URI ?? "http://localhost:3000/api/auth/keycloak/callback"
  )
  return `${issuer}/protocol/openid-connect/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${redirectUri}&response_type=code&scope=openid`
}
