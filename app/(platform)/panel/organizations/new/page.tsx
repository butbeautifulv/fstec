import { OrganizationForm } from "@/components/platform/organization-form"
import { PageHeader } from "@/components/shared/page-header"
import { labels } from "@/lib/ui/branding"

export default function NewOrganizationPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Новая ${labels.org.toLowerCase()}`}
        description={`Добавление ${labels.orgGenitive} в систему`}
        backHref="/panel/organizations"
        backLabel={labels.orgs}
      />
      <OrganizationForm />
    </div>
  )
}
