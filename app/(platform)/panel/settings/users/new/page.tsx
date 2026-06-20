import { UserForm } from "@/components/platform/user-form"
import { PageHeader } from "@/components/shared/page-header"
import { requirePagePermission } from "@/lib/auth/page-guard"
import { Permission } from "@/lib/auth/permissions"

export default async function NewSettingsUserPage() {
  await requirePagePermission(Permission.usersManage)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новый пользователь"
        description="Добавление учётной записи админ-панели"
        backHref="/panel/settings/users"
        backLabel="Пользователи"
      />
      <UserForm />
    </div>
  )
}
