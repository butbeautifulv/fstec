import { notFound } from "next/navigation"
import { UserForm } from "@/components/platform/user-form"
import { PageHeader } from "@/components/shared/page-header"
import { requirePagePermission } from "@/lib/auth/page-guard"
import { Permission } from "@/lib/auth/permissions"
import { getUserById } from "@/lib/users"

export default async function EditSettingsUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePagePermission(Permission.usersManage)
  const { id } = await params
  const user = await getUserById(Number(id))
  if (!user) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Редактирование: ${user.name}`}
        description={user.email}
        backHref="/panel/settings/users"
        backLabel="Пользователи"
      />
      <UserForm
        user={{
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }}
      />
    </div>
  )
}
