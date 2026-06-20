export type AuthProviderId = "local" | "active_directory" | "keycloak"

export type AuthCredentials = {
  email: string
  password: string
}

export type AuthUser = {
  id: number
  email: string
  name: string
  role: import("@prisma/client").UserRole
  mustChangePassword: boolean
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string; status?: number }

export type AuthProviderStatus = {
  id: AuthProviderId
  label: string
  configured: boolean
  message: string
  requiredEnv: string[]
}

export interface AuthProvider {
  id: AuthProviderId
  label: string
  authenticate(credentials: AuthCredentials): Promise<AuthResult>
  getStatus(): AuthProviderStatus
}
