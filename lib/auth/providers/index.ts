import { activeDirectoryAuthProvider } from "./active-directory"
import { keycloakAuthProvider } from "./keycloak"
import { localAuthProvider } from "./local"
import type { AuthProvider, AuthProviderId, AuthProviderStatus } from "./types"

const providers: Record<AuthProviderId, AuthProvider> = {
  local: localAuthProvider,
  active_directory: activeDirectoryAuthProvider,
  keycloak: keycloakAuthProvider,
}

export function getAuthProviderId(): AuthProviderId {
  const value = process.env.AUTH_PROVIDER?.trim()
  if (value === "active_directory" || value === "keycloak" || value === "local") {
    return value
  }
  return "local"
}

export function getAuthProvider(): AuthProvider {
  return providers[getAuthProviderId()]
}

export function getAuthProviderStatus(): AuthProviderStatus {
  return getAuthProvider().getStatus()
}

export function listAuthProviderStatuses(): AuthProviderStatus[] {
  return Object.values(providers).map((provider) => provider.getStatus())
}

export function authProvidersPayload() {
  return {
    activeProvider: getAuthProviderId(),
    activeStatus: getAuthProviderStatus(),
    providers: listAuthProviderStatuses(),
  }
}

export type { AuthCredentials, AuthProvider, AuthProviderId, AuthProviderStatus, AuthResult } from "./types"
