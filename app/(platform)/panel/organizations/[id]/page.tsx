import { notFound } from "next/navigation"
import { OrgDetailClient } from "@/components/platform/org-detail-client"
import { getOrganizationLinks } from "@/lib/access-links"
import { getOrganization } from "@/lib/organizations"
import { serializeAccessLinks } from "@/lib/serialize/panel"

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = Number((await params).id)
  const [org, links] = await Promise.all([
    getOrganization(id),
    getOrganizationLinks(id),
  ])
  if (!org) notFound()

  return (
    <OrgDetailClient
      organizationId={org.id}
      organizationName={org.name}
      initialSubdivisions={org.subdivisions}
      initialLinks={serializeAccessLinks(links)}
    />
  )
}
