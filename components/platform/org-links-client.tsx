"use client"

import { OrgBreadcrumb } from "@/components/platform/org-breadcrumb"
import { OrgLinksPanel } from "@/components/platform/org-links-panel"
import { PageHeader } from "@/components/shared/page-header"

type Subdivision = { id: number; name: string }

type LinkRow = {
  id: number
  token: string
  revokedAt: string | null
  subdivisionId: number | null
  subdivision: { id: number; name: string } | null
}

export function OrgLinksClient({
  organizationId,
  organizationName,
  initialSubdivisions,
  initialLinks,
  orgReportToken = null,
  subReportTokens = {},
  canManageReportLinks = false,
}: {
  organizationId: number
  organizationName: string
  initialSubdivisions: Subdivision[]
  initialLinks: LinkRow[]
  orgReportToken?: string | null
  subReportTokens?: Record<number, string>
  canManageReportLinks?: boolean
}) {
  const hubHref = `/panel/organizations/${organizationId}`

  return (
    <div className="flex flex-col gap-6">
      <OrgBreadcrumb organizationId={organizationId} organizationName={organizationName} />
      <PageHeader
        title="Подразделения и ссылки"
        description="Структура подразделений, portal- и report-ссылки для исполнителей"
        backHref={hubHref}
        backLabel={organizationName}
      />
      <OrgLinksPanel
        organizationId={organizationId}
        initialSubdivisions={initialSubdivisions}
        initialLinks={initialLinks}
        orgReportToken={orgReportToken}
        subReportTokens={subReportTokens}
        canManageReportLinks={canManageReportLinks}
      />
    </div>
  )
}
