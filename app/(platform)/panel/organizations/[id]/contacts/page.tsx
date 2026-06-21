import { notFound } from "next/navigation"
import { OrgContactsClient } from "@/components/platform/org-contacts-client"
import { requirePageSession } from "@/lib/auth/page-guard"
import { listAllOrganizationContacts } from "@/lib/contacts"
import { getOrganization } from "@/lib/organizations"

export default async function OrganizationContactsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePageSession()
  const id = Number((await params).id)
  const [org, contacts] = await Promise.all([
    getOrganization(id),
    listAllOrganizationContacts(id),
  ])
  if (!org) notFound()

  return (
    <OrgContactsClient
      organizationId={org.id}
      organizationName={org.name}
      initialSubdivisions={org.subdivisions}
      initialContacts={contacts.map((contact) => ({
        id: contact.id,
        fullName: contact.fullName,
        position: contact.position,
        email: contact.email,
        role: contact.role,
        subdivisionId: contact.subdivisionId,
        subdivision: contact.subdivision,
      }))}
    />
  )
}
