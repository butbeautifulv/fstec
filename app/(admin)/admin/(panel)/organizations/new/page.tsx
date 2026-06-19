import { OrganizationForm } from "@/components/admin/organization-form"
import { PageHeader } from "@/components/admin/page-header"
import { labels } from "@/lib/ui/branding"

export default function NewOrganizationPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Новая ${labels.org.toLowerCase()}`}
        description={`Добавление ${labels.orgGenitive} в систему`}
        backHref="/admin/organizations"
        backLabel={labels.orgs}
      />
      <OrganizationForm />
    </div>
  )
}
