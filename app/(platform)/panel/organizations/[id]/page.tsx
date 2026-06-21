import { notFound } from "next/navigation"
import { OrgHubClient } from "@/components/platform/org-hub-client"
import { requirePageSession } from "@/lib/auth/page-guard"
import { getOrganization } from "@/lib/organizations"

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePageSession()
  const id = Number((await params).id)
  const org = await getOrganization(id)
  if (!org) notFound()

  return <OrgHubClient organizationId={org.id} organizationName={org.name} />
}
