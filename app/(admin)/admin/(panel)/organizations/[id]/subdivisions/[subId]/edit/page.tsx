import { notFound } from "next/navigation"
import { OrgBreadcrumb } from "@/components/admin/org-breadcrumb"
import { PageHeader } from "@/components/admin/page-header"
import { SubdivisionForm } from "@/components/admin/subdivision-form"
import { getOrganization, getSubdivision } from "@/lib/organizations"

export default async function EditSubdivisionPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>
}) {
  const { id, subId } = await params
  const orgId = Number(id)
  const org = await getOrganization(orgId)
  if (!org) notFound()

  const subdivision = await getSubdivision(Number(subId))
  if (!subdivision || subdivision.organizationId !== orgId) notFound()

  return (
    <div className="flex flex-col gap-6">
      <OrgBreadcrumb organizationId={org.id} organizationName={org.name} />
      <PageHeader
        title="Редактирование подразделения"
        description={org.name}
        backHref={`/admin/organizations/${org.id}`}
        backLabel={org.name}
      />
      <SubdivisionForm
        organizationId={org.id}
        subdivision={{ id: subdivision.id, name: subdivision.name }}
      />
    </div>
  )
}
