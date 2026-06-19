import { notFound } from "next/navigation"
import { OrgDetailClient } from "@/components/admin/org-detail-client"
import { getOrganizationLinks } from "@/lib/access-links"
import { getOrganization } from "@/lib/organizations"

type Params = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function OrganizationDetailPage({ params, searchParams }: Params) {
  const id = Number((await params).id)
  const { tab } = await searchParams
  const org = await getOrganization(id)
  if (!org) notFound()

  const links = await getOrganizationLinks(id)
  const defaultTab = tab === "links" ? "links" : "subdivisions"

  return (
    <OrgDetailClient
      organizationId={org.id}
      organizationName={org.name}
      initialSubdivisions={org.subdivisions}
      initialLinks={JSON.parse(JSON.stringify(links))}
      defaultTab={defaultTab}
    />
  )
}
