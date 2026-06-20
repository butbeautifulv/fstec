import { notFound } from "next/navigation"
import { OrgDetailClient } from "@/components/admin/org-detail-client"
import { getOrganizationLinks } from "@/lib/access-links"
import { getOrganization } from "@/lib/organizations"

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = Number((await params).id)
  const org = await getOrganization(id)
  if (!org) notFound()

  const links = await getOrganizationLinks(id)

  return (
    <OrgDetailClient
      organizationId={org.id}
      organizationName={org.name}
      initialSubdivisions={org.subdivisions}
      initialLinks={JSON.parse(JSON.stringify(links))}
    />
  )
}
