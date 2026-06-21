import { notFound } from "next/navigation"
import { OrgBreadcrumb } from "@/components/platform/org-breadcrumb"
import { PageHeader } from "@/components/shared/page-header"
import { SubdivisionForm } from "@/components/platform/subdivision-form"
import { getOrganization, getSubdivision } from "@/lib/organizations"

export default async function EditSubdivisionPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>
}) {
  const { id, subId } = await params
  const orgId = Number(id)
  const subdivisionId = Number(subId)
  const [org, subdivision] = await Promise.all([
    getOrganization(orgId),
    getSubdivision(subdivisionId),
  ])
  if (!org) notFound()
  if (!subdivision || subdivision.organizationId !== orgId) notFound()

  return (
    <div className="flex flex-col gap-6">
      <OrgBreadcrumb organizationId={org.id} organizationName={org.name} />
      <PageHeader
        title="Редактирование подразделения"
        description={org.name}
        backHref={`/panel/organizations/${org.id}/links`}
        backLabel="Подразделения и ссылки"
      />
      <SubdivisionForm
        organizationId={org.id}
        subdivision={{ id: subdivision.id, name: subdivision.name }}
      />
    </div>
  )
}
