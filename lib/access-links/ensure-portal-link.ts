import {
  createOrganizationAccessLink,
  createSubdivisionAccessLink,
  getActiveOrgLink,
  getActiveSubdivisionLink,
} from "@/lib/access-links"

export async function ensurePortalLink(input: {
  organizationId: number
  subdivisionId: number | null
}) {
  if (input.subdivisionId != null) {
    const existing = await getActiveSubdivisionLink(input.subdivisionId)
    if (existing) return existing
    return createSubdivisionAccessLink(input.subdivisionId)
  }

  const existing = await getActiveOrgLink(input.organizationId)
  if (existing) return existing
  return createOrganizationAccessLink(input.organizationId)
}
