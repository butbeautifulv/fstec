import { OrganizationsManager } from "@/components/platform/organizations-manager"
import { listOrganizations } from "@/lib/organizations"
import { getHeadOrganizationId } from "@/lib/settings"

export default async function OrganizationsPage() {
  const [orgs, headOrganizationId] = await Promise.all([
    listOrganizations(),
    getHeadOrganizationId(),
  ])

  return (
    <OrganizationsManager initialOrgs={orgs} headOrganizationId={headOrganizationId} />
  )
}
