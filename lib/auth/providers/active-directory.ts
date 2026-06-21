import type { AuthCredentials, AuthProvider, AuthResult, AuthProviderStatus } from "./types"

const REQUIRED_ENV = ["AD_LDAP_URL", "AD_BASE_DN"] as const

function isConfigured() {
  return REQUIRED_ENV.every((key) => Boolean(process.env[key]?.trim()))
}

export const activeDirectoryAuthProvider: AuthProvider = {
  id: "active_directory",
  label: "Active Directory",

  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    void credentials
    if (!isConfigured()) {
      return {
        ok: false,
        error: "Active Directory integration is not configured",
        status: 501,
      }
    }
    return {
      ok: false,
      error: "Active Directory authentication is not implemented yet",
      status: 501,
    }
  },

  getStatus(): AuthProviderStatus {
    const configured = isConfigured()
    return {
      id: "active_directory",
      label: "Active Directory",
      configured,
      message: configured
        ? "Параметры заданы; LDAP-аутентификация будет подключена в следующей версии"
        : "Укажите AD_LDAP_URL и AD_BASE_DN для подготовки интеграции",
      requiredEnv: [...REQUIRED_ENV],
    }
  },
}
