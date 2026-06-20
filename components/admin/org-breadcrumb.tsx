"use client"

import { useMemo } from "react"
import { useAdminBreadcrumbMiddle } from "@/components/admin/admin-breadcrumb"

export function OrgBreadcrumb({
  organizationId,
  organizationName,
}: {
  organizationId: number
  organizationName: string
}) {
  const middleCrumbs = useMemo(
    () => [{ label: organizationName, href: `/admin/organizations/${organizationId}` }],
    [organizationId, organizationName]
  )
  useAdminBreadcrumbMiddle(middleCrumbs)
  return null
}
