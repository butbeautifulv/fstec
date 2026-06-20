import { notFound } from "next/navigation"
import { OrgBreadcrumb } from "@/components/platform/org-breadcrumb"
import { OrganizationForm } from "@/components/platform/organization-form"
import { PageHeader } from "@/components/shared/page-header"
import { getOrganization } from "@/lib/organizations"
import { labels } from "@/lib/ui/branding"

export default async function EditOrganizationPage({
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
        title={`Редактирование: ${org.name}`}
        description={`Изменение данных ${labels.orgGenitive}`}
        backHref={`/panel/organizations/${org.id}`}
        backLabel={org.name}
      />
      <OrganizationForm
        organization={{
          id: org.id,
          name: org.name,
          shortCode: org.shortCode,
        }}
      />
    </div>
  )
}
