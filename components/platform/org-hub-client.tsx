"use client"

import { usePlatformBreadcrumbLabel } from "@/components/platform/platform-breadcrumb"
import { OrgNav } from "@/components/platform/org-nav"
import { OrgPageHeader } from "@/components/platform/org-page-header"

export function OrgHubClient({
  organizationId,
  organizationName,
}: {
  organizationId: number
  organizationName: string
}) {
  usePlatformBreadcrumbLabel(organizationName)

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader
        organizationId={organizationId}
        organizationName={organizationName}
        description="Подразделения, ссылки и контакты для оповещений"
      />
      <OrgNav organizationId={organizationId} />
    </div>
  )
}
