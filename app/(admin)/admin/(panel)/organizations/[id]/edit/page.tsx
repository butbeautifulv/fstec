import { notFound } from "next/navigation"
import { OrganizationForm } from "@/components/admin/organization-form"
import { PageHeader } from "@/components/admin/page-header"
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
      <PageHeader
        title={`Редактирование: ${org.name}`}
        description={`Изменение данных ${labels.orgGenitive}`}
        backHref={`/admin/organizations/${org.id}`}
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
