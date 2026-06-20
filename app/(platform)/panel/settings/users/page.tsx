import { UsersListClient } from "@/components/platform/users-list-client"
import { requirePagePermission } from "@/lib/auth/page-guard"
import { Permission } from "@/lib/auth/permissions"
import { listUsers } from "@/lib/users"

export default async function SettingsUsersPage() {
  await requirePagePermission(Permission.usersManage)
  const users = await listUsers()

  return <UsersListClient initialUsers={JSON.parse(JSON.stringify(users))} />
}
