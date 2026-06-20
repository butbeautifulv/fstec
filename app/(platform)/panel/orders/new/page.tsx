import { listOrganizations } from "@/lib/organizations"
import { getHeadOrganizationId } from "@/lib/settings"
import { OrderCreateForm } from "@/components/platform/order-create-form"
import { PageHeader } from "@/components/shared/page-header"
import { labels } from "@/lib/ui/branding"

export default async function NewOrderPage() {
  const [organizations, headOrganizationId] = await Promise.all([
    listOrganizations(),
    getHeadOrganizationId(),
  ])

  const initialOrganizations = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    subdivisions: org.subdivisions.map((subdivision) => ({
      id: subdivision.id,
      name: subdivision.name,
    })),
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новое поручение"
        description={`Назначение мер ${labels.orgGenitive}`}
        backHref="/panel/orders"
        backLabel="Поручения"
      />
      <OrderCreateForm
        initialOrganizations={initialOrganizations}
        initialHeadOrganizationId={headOrganizationId}
      />
    </div>
  )
}
