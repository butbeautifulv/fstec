import type { UserRole } from "@prisma/client"
import { getPermissionsForRole, type Permission } from "@/lib/auth/permissions"

export type PlatformSessionUser = {
  id: number
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
}

export function buildPlatformSessionUser(user: {
  id: number
  email: string
  name: string
  role: UserRole
}): PlatformSessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: getPermissionsForRole(user.role),
  }
}
