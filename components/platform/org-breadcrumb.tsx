"use client"

import { useMemo } from "react"
import { usePlatformBreadcrumbMiddle } from "@/components/platform/platform-breadcrumb"

export function OrgBreadcrumb({
  organizationId,
  organizationName,
}: {
  organizationId: number
  organizationName: string
}) {
  const middleCrumbs = useMemo(
    () => [{ label: organizationName, href: `/panel/organizations/${organizationId}` }],
    [organizationId, organizationName]
  )
  usePlatformBreadcrumbMiddle(middleCrumbs)
  return null
}
