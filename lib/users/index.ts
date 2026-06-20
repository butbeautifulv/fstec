import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/users"
import type { UpdateAccountInput } from "@/lib/validations/account"

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  locale: true,
  mustChangePassword: true,
  createdAt: true,
} as const

export function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "asc" },
  })
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error("EMAIL_EXISTS")

  const passwordHash = await hashPassword(data.password)
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      mustChangePassword: data.mustChangePassword,
    },
    select: userSelect,
  })
}

export function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  })
}

async function countSuperAdmins(excludeId?: number) {
  return prisma.user.count({
    where: {
      role: UserRole.SUPER_ADMIN,
      ...(excludeId != null ? { id: { not: excludeId } } : {}),
    },
  })
}

export async function updateUser(
  id: number,
  data: UpdateUserInput,
  options?: { actorId?: number }
) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new Error("NOT_FOUND")

  if (data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailTaken) throw new Error("EMAIL_EXISTS")
  }

  const isSelf = options?.actorId != null && options.actorId === id
  const nextRole = isSelf ? existing.role : data.role

  if (
    existing.role === UserRole.SUPER_ADMIN &&
    nextRole !== UserRole.SUPER_ADMIN &&
    (await countSuperAdmins(id)) === 0
  ) {
    throw new Error("LAST_SUPER_ADMIN")
  }

  const hasNewPassword = Boolean(data.password?.length)
  const passwordHash = hasNewPassword ? await hashPassword(data.password!) : undefined

  return prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      role: nextRole,
      ...(passwordHash != null && { passwordHash }),
      ...(hasNewPassword && {
        mustChangePassword: data.mustChangePassword ?? false,
      }),
    },
    select: userSelect,
  })
}

export async function changeUserPassword(
  userId: number,
  newPassword: string
) {
  const passwordHash = await hashPassword(newPassword)
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
    select: userSelect,
  })
}

export async function updateAccount(userId: number, data: UpdateAccountInput) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) throw new Error("NOT_FOUND")

  if (data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailTaken) throw new Error("EMAIL_EXISTS")
  }

  const hasNewPassword = Boolean(data.password?.length)
  if (hasNewPassword) {
    const validCurrent = await verifyPassword(
      data.currentPassword ?? "",
      existing.passwordHash
    )
    if (!validCurrent) throw new Error("INVALID_CURRENT_PASSWORD")
  }

  const passwordHash = hasNewPassword ? await hashPassword(data.password!) : undefined

  return prisma.user.update({
    where: { id: userId },
    data: {
      email: data.email,
      name: data.name,
      ...(data.locale !== undefined && { locale: data.locale }),
      ...(passwordHash != null && {
        passwordHash,
        mustChangePassword: false,
      }),
    },
    select: userSelect,
  })
}

export async function deleteUser(id: number, actorId: number) {
  if (actorId === id) throw new Error("CANNOT_DELETE_SELF")

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new Error("NOT_FOUND")

  if (existing.role === UserRole.SUPER_ADMIN && (await countSuperAdmins(id)) === 0) {
    throw new Error("LAST_SUPER_ADMIN")
  }

  const [measuresCount, ordersCount] = await Promise.all([
    prisma.measure.count({ where: { createdById: id } }),
    prisma.order.count({ where: { createdById: id } }),
  ])
  if (measuresCount > 0 || ordersCount > 0) {
    throw new Error("USER_HAS_DATA")
  }

  return prisma.user.delete({ where: { id } })
}

/** @deprecated use listUsers */
export const listAdminUsers = listUsers

/** @deprecated use createUser */
export async function createAdminUser(data: CreateUserInput) {
  return createUser(data)
}

export type { UserRole }
