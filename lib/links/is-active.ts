export type RevocableLink = {
  revokedAt: Date | null
  expiresAt: Date | null
}

export function isRevocableLinkActive(link: RevocableLink): boolean {
  if (link.revokedAt) return false
  if (link.expiresAt && link.expiresAt < new Date()) return false
  return true
}
