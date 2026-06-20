import type { UserRole } from "@prisma/client"

export const Permission = {
  settingsRead: "settings:read",
  settingsWrite: "settings:write",
  usersManage: "users:manage",
  measuresRead: "measures:read",
  measuresWrite: "measures:write",
  ordersRead: "orders:read",
  ordersWrite: "orders:write",
  orgsRead: "orgs:read",
  orgsWrite: "orgs:write",
  delaysRead: "delays:read",
  delaysWrite: "delays:write",
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const ALL_PERMISSIONS = Object.values(Permission)

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Суперадминистратор",
  OPERATOR: "Оператор",
  VIEWER: "Наблюдатель",
}

export const ASSIGNABLE_ROLES: UserRole[] = ["SUPER_ADMIN", "OPERATOR", "VIEWER"]

/** Legacy sessions / cookies may still carry the pre-RBAC role value. */
const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  ADMIN: "SUPER_ADMIN",
}

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  OPERATOR: [
    Permission.measuresRead,
    Permission.measuresWrite,
    Permission.ordersRead,
    Permission.ordersWrite,
    Permission.orgsRead,
    Permission.orgsWrite,
    Permission.delaysRead,
    Permission.delaysWrite,
  ],
  VIEWER: [
    Permission.measuresRead,
    Permission.ordersRead,
    Permission.orgsRead,
    Permission.delaysRead,
  ],
}

export function normalizeRole(role: UserRole | string | null | undefined): UserRole | null {
  if (!role) return null
  const aliased = LEGACY_ROLE_ALIASES[role] ?? role
  if (aliased in ROLE_PERMISSIONS) return aliased as UserRole
  return null
}

export function getPermissionsForRole(role: UserRole | string | null | undefined): Permission[] {
  const normalized = normalizeRole(role)
  return normalized ? [...ROLE_PERMISSIONS[normalized]] : []
}

export function hasPermission(
  role: UserRole | string | null | undefined,
  permission: Permission
): boolean {
  const normalized = normalizeRole(role)
  return normalized ? ROLE_PERMISSIONS[normalized].includes(permission) : false
}

export function hasAnyPermission(
  role: UserRole | string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p))
}
