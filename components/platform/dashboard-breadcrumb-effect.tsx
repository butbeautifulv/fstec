"use client"

import { useMemo } from "react"
import { OrgBreadcrumb } from "@/components/platform/org-breadcrumb"
import {
  usePlatformBreadcrumbLabel,
  usePlatformBreadcrumbMiddle,
} from "@/components/platform/platform-breadcrumb"

export function OrganizationDashboardBreadcrumbEffect({
  organizationId,
  organizationName,
}: {
  organizationId: number
  organizationName: string
}) {
  usePlatformBreadcrumbLabel("Сводка")
  return <OrgBreadcrumb organizationId={organizationId} organizationName={organizationName} />
}

export function SubdivisionDashboardBreadcrumbEffect({
  organizationId,
  organizationName,
  subdivisionId,
  subdivisionName,
}: {
  organizationId: number
  organizationName: string
  subdivisionId: number
  subdivisionName: string
}) {
  const middleCrumbs = useMemo(
    () => [
      {
        label: organizationName,
        href: `/panel/organizations/${organizationId}`,
      },
      {
        label: subdivisionName,
        href: `/panel/organizations/${organizationId}/subdivisions/${subdivisionId}/dashboard`,
      },
    ],
    [organizationId, organizationName, subdivisionId, subdivisionName]
  )

  usePlatformBreadcrumbMiddle(middleCrumbs)
  usePlatformBreadcrumbLabel("Сводка")
  return null
}
