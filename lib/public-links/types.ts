export type LinkScopeKind = "report" | "organization" | "subdivision"

export type LinkScopeStatus = "active" | "missing"

export type LinkScopeActiveLink = {
  id: number
  token: string
  createdAt: string
  path: string
}

export type LinkScopeRow = {
  key: string
  kind: LinkScopeKind
  organizationId?: number
  organizationName?: string
  subdivisionId?: number
  subdivisionName?: string
  activeLink?: LinkScopeActiveLink
  /** Scoped read-only report URL (/report/{token}). */
  reportPath?: string
  status: LinkScopeStatus
}

export type RegeneratedLinkScope = {
  key: string
  path: string
  token: string
}

export function parseLinkScopeKey(key: string): LinkScopeKind | null {
  if (key === "report") return "report"
  if (/^org:\d+$/.test(key)) return "organization"
  if (/^sub:\d+$/.test(key)) return "subdivision"
  return null
}

export function organizationLinkScopeKey(organizationId: number) {
  return `org:${organizationId}`
}

export function subdivisionLinkScopeKey(subdivisionId: number) {
  return `sub:${subdivisionId}`
}
