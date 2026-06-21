import { notFound } from "next/navigation"
import { OrgLinksClient } from "@/components/platform/org-links-client"
import { requirePageSession } from "@/lib/auth/page-guard"
import { getOrganizationLinks } from "@/lib/access-links"
import { getOrganization } from "@/lib/organizations"
import {
  getOrganizationReportTokens,
  getReportShareContext,
} from "@/lib/report-links/share-context"
import { serializeAccessLinks } from "@/lib/serialize/panel"

export default async function OrganizationLinksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requirePageSession()
  const id = Number((await params).id)
  const [org, links, reportShare] = await Promise.all([
    getOrganization(id),
    getOrganizationLinks(id),
    getReportShareContext(session),
  ])
  if (!org) notFound()

  const reportTokens = await getOrganizationReportTokens(
    org.id,
    org.subdivisions.map((sub) => sub.id)
  )

  return (
    <OrgLinksClient
      organizationId={org.id}
      organizationName={org.name}
      initialSubdivisions={org.subdivisions}
      initialLinks={serializeAccessLinks(links)}
      orgReportToken={reportTokens.orgReportToken}
      subReportTokens={reportTokens.subReportTokens}
      canManageReportLinks={reportShare.canManageReportLinks}
    />
  )
}
