import { notFound } from "next/navigation"
import { OrgBreadcrumb } from "@/components/platform/org-breadcrumb"
import { PageHeader } from "@/components/shared/page-header"
import { SubdivisionForm } from "@/components/platform/subdivision-form"
import { getOrganization } from "@/lib/organizations"

export default async function NewSubdivisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const org = await getOrganization(Number(id))
  if (!org) notFound()

  return (
    <div className="flex flex-col gap-6">
      <OrgBreadcrumb organizationId={org.id} organizationName={org.name} />
      <PageHeader
        title="Новое подразделение"
        description={org.name}
        backHref={`/panel/organizations/${org.id}/links`}
        backLabel="Подразделения и ссылки"
      />
      <SubdivisionForm organizationId={org.id} />
    </div>
  )
}
