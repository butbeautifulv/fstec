import { Suspense } from "react"
import dynamic from "next/dynamic"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { listOrganizations } from "@/lib/organizations"
import { getHeadOrganizationId } from "@/lib/settings"

const OrganizationsManager = dynamic(
  () =>
    import("@/components/platform/organizations-manager").then(
      (mod) => mod.OrganizationsManager
    ),
  { loading: () => <TablePageSkeleton /> }
)

async function OrganizationsTableSection() {
  const [orgs, headOrganizationId] = await Promise.all([
    listOrganizations(),
    getHeadOrganizationId(),
  ])

  return (
    <OrganizationsManager initialOrgs={orgs} headOrganizationId={headOrganizationId} />
  )
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <OrganizationsTableSection />
    </Suspense>
  )
}
