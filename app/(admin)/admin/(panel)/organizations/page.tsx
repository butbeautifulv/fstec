import { OrganizationsManager } from "@/components/admin/organizations-manager"
import { listOrganizations } from "@/lib/organizations"

export default async function OrganizationsPage() {
  const orgs = await listOrganizations()

  return <OrganizationsManager initialOrgs={orgs} />
}
