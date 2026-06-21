import {
  createOrganizationAccessLink,
  createSubdivisionAccessLink,
} from "@/lib/access-links"
import { prisma } from "@/lib/db"
import { createReportLink } from "@/lib/report-links"
import {
  organizationLinkScopeKey,
  parseLinkScopeKey,
  subdivisionLinkScopeKey,
  type RegeneratedLinkScope,
} from "@/lib/public-links/types"

export async function regeneratePublicLinkScopes(
  keys: string[]
): Promise<RegeneratedLinkScope[]> {
  const uniqueKeys = [...new Set(keys)]
  const results: RegeneratedLinkScope[] = []

  for (const key of uniqueKeys) {
    const kind = parseLinkScopeKey(key)
    if (!kind) {
      throw new Error(`Unknown link scope key: ${key}`)
    }

    if (kind === "report") {
      const link = await createReportLink({ type: "global" })
      results.push({
        key,
        token: link.token,
        path: `/report/${link.token}`,
      })
      continue
    }

    if (kind === "organization") {
      const organizationId = Number(key.slice("org:".length))
      if (!Number.isFinite(organizationId)) {
        throw new Error(`Invalid organization scope key: ${key}`)
      }
      const [link] = await Promise.all([
        createOrganizationAccessLink(organizationId),
        createReportLink({ type: "organization", organizationId }),
      ])
      results.push({
        key: organizationLinkScopeKey(organizationId),
        token: link.token,
        path: `/p/${link.token}`,
      })
      continue
    }

    const subdivisionId = Number(key.slice("sub:".length))
    if (!Number.isFinite(subdivisionId)) {
      throw new Error(`Invalid subdivision scope key: ${key}`)
    }
    const subdivision = await prisma.subdivision.findUniqueOrThrow({
      where: { id: subdivisionId },
    })
    const [link] = await Promise.all([
      createSubdivisionAccessLink(subdivisionId),
      createReportLink({
        type: "subdivision",
        organizationId: subdivision.organizationId,
        subdivisionId,
      }),
    ])
    results.push({
      key: subdivisionLinkScopeKey(subdivisionId),
      token: link.token,
      path: `/p/${link.token}`,
    })
  }

  return results
}

export async function regenerateAllActivePublicLinkScopes(
  scopes: { key: string; status: "active" | "missing" }[]
): Promise<RegeneratedLinkScope[]> {
  const activeKeys = scopes
    .filter((scope) => scope.status === "active")
    .map((scope) => scope.key)
  return regeneratePublicLinkScopes(activeKeys)
}
