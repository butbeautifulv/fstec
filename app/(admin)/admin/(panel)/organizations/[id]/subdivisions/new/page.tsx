import { notFound } from "next/navigation"
import { OrgBreadcrumb } from "@/components/admin/org-breadcrumb"
import { PageHeader } from "@/components/admin/page-header"
import { SubdivisionForm } from "@/components/admin/subdivision-form"
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
        backHref={`/admin/organizations/${org.id}`}
        backLabel={org.name}
      />
      <SubdivisionForm organizationId={org.id} />
    </div>
  )
}
