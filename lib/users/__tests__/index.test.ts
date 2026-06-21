import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserRole } from "@prisma/client"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))
const mockHashPassword = vi.hoisted(() => vi.fn())
const mockVerifyPassword = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import {
  changeUserPassword,
  createAdminUser,
  createUser,
  deleteUser,
  getUserById,
  listAdminUsers,
  listUsers,
  updateAccount,
  updateUser,
} from "@/lib/users"

const userRow = {
  id: 1,
  email: "a@test.com",
  name: "Alice",
  role: UserRole.OPERATOR,
  locale: "ru",
  mustChangePassword: false,
  createdAt: new Date(),
}

describe("users index exports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHashPassword.mockResolvedValue("hashed-password")
    mockVerifyPassword.mockResolvedValue(true)
  })

  it("listUsers returns users with select fields", async () => {
    mockPrisma.user.findMany.mockResolvedValue([userRow])
    const result = await listUsers()
    expect(result).toEqual([userRow])
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } })
    )
  })

  it("listAdminUsers delegates to listUsers", async () => {
    mockPrisma.user.findMany.mockResolvedValue([userRow])
    const result = await listAdminUsers()
    expect(result).toEqual([userRow])
    expect(mockPrisma.user.findMany).toHaveBeenCalled()
  })

  it("createUser throws EMAIL_EXISTS when email taken", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 2 })
    await expect(
      createUser({
        email: "a@test.com",
        name: "Alice",
        password: "secret",
        passwordConfirm: "secret",
        role: UserRole.OPERATOR,
        mustChangePassword: false,
      })
    ).rejects.toThrow("EMAIL_EXISTS")
  })

  it("createUser hashes password and persists user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue(userRow)
    await createUser({
      email: "a@test.com",
      name: "Alice",
      password: "secret",
      passwordConfirm: "secret",
      role: UserRole.OPERATOR,
      mustChangePassword: true,
    })
    expect(mockHashPassword).toHaveBeenCalledWith("secret")
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "a@test.com",
          passwordHash: "hashed-password",
          mustChangePassword: true,
        }),
      })
    )
  })

  it("getUserById loads user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(userRow)
    const result = await getUserById(1)
    expect(result).toEqual(userRow)
  })

  it("updateUser throws NOT_FOUND when user missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    await expect(
      updateUser(1, {
        email: "a@test.com",
        name: "Alice",
        role: UserRole.OPERATOR,
      })
    ).rejects.toThrow("NOT_FOUND")
  })

  it("updateUser throws EMAIL_EXISTS when email taken by another user", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 1, email: "old@test.com", role: UserRole.OPERATOR })
      .mockResolvedValueOnce({ id: 2, email: "new@test.com" })
    await expect(
      updateUser(1, {
        email: "new@test.com",
        name: "Alice",
        role: UserRole.OPERATOR,
      })
    ).rejects.toThrow("EMAIL_EXISTS")
  })

  it("changeUserPassword updates hash and clears mustChangePassword", async () => {
    mockPrisma.user.update.mockResolvedValue(userRow)
    await changeUserPassword(1, "new-secret")
    expect(mockHashPassword).toHaveBeenCalledWith("new-secret")
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { passwordHash: "hashed-password", mustChangePassword: false },
      })
    )
  })

  it("updateAccount throws INVALID_CURRENT_PASSWORD when current password wrong", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...userRow,
      passwordHash: "stored-hash",
    })
    mockVerifyPassword.mockResolvedValue(false)
    await expect(
      updateAccount(1, {
        email: "a@test.com",
        name: "Alice",
        password: "new-secret",
        currentPassword: "wrong",
      })
    ).rejects.toThrow("INVALID_CURRENT_PASSWORD")
  })

  it("updateAccount throws EMAIL_EXISTS when email taken", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ ...userRow, email: "old@test.com", passwordHash: "hash" })
      .mockResolvedValueOnce({ id: 2, email: "new@test.com" })
    await expect(
      updateAccount(1, {
        email: "new@test.com",
        name: "Alice",
      })
    ).rejects.toThrow("EMAIL_EXISTS")
  })

  it("updateAccount changes password when current password valid", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...userRow,
      passwordHash: "stored-hash",
    })
    mockPrisma.user.update.mockResolvedValue(userRow)
    await updateAccount(1, {
      email: "a@test.com",
      name: "Alice",
      currentPassword: "OldPass!123456789",
      password: "NewStr0ng!Passw0rdLong",
    })
    expect(mockVerifyPassword).toHaveBeenCalledWith("OldPass!123456789", "stored-hash")
    expect(mockHashPassword).toHaveBeenCalledWith("NewStr0ng!Passw0rdLong")
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: "hashed-password",
          mustChangePassword: false,
        }),
      })
    )
  })

  it("updateAccount throws NOT_FOUND when user missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    await expect(
      updateAccount(99, { email: "a@test.com", name: "Alice" })
    ).rejects.toThrow("NOT_FOUND")
  })

  it("deleteUser throws NOT_FOUND when user missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    await expect(deleteUser(2, 1)).rejects.toThrow("NOT_FOUND")
  })

  it("deleteUser throws CANNOT_DELETE_SELF", async () => {
    await expect(deleteUser(5, 5)).rejects.toThrow("CANNOT_DELETE_SELF")
  })

  it("deleteUser throws USER_HAS_DATA when user created measures or orders", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 2,
      role: UserRole.OPERATOR,
    })
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.measure.count.mockResolvedValue(1)
    mockPrisma.order.count.mockResolvedValue(0)
    await expect(deleteUser(2, 1)).rejects.toThrow("USER_HAS_DATA")
  })

  it("deleteUser removes user when safe", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 2,
      role: UserRole.OPERATOR,
    })
    mockPrisma.user.count.mockResolvedValue(1)
    mockPrisma.measure.count.mockResolvedValue(0)
    mockPrisma.order.count.mockResolvedValue(0)
    mockPrisma.user.delete.mockResolvedValue({ id: 2 })
    await deleteUser(2, 1)
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } })
  })

  it("updateUser throws LAST_SUPER_ADMIN when demoting last super admin", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "admin@test.com",
      role: UserRole.SUPER_ADMIN,
    })
    mockPrisma.user.count.mockResolvedValue(0)
    await expect(
      updateUser(1, {
        email: "admin@test.com",
        name: "Admin",
        role: UserRole.OPERATOR,
      })
    ).rejects.toThrow("LAST_SUPER_ADMIN")
  })

  it("deleteUser throws LAST_SUPER_ADMIN for last super admin", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 2,
      role: UserRole.SUPER_ADMIN,
    })
    mockPrisma.user.count.mockResolvedValue(0)
    await expect(deleteUser(2, 1)).rejects.toThrow("LAST_SUPER_ADMIN")
  })

  it("updateUser hashes password when provided", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@test.com",
      role: UserRole.OPERATOR,
    })
    mockPrisma.user.update.mockResolvedValue(userRow)
    await updateUser(1, {
      email: "a@test.com",
      name: "Alice",
      role: UserRole.OPERATOR,
      password: "NewStr0ng!Passw0rdLong",
      passwordConfirm: "NewStr0ng!Passw0rdLong",
      mustChangePassword: true,
    })
    expect(mockHashPassword).toHaveBeenCalledWith("NewStr0ng!Passw0rdLong")
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: "hashed-password",
          mustChangePassword: true,
        }),
      })
    )
  })

  it("updateUser preserves role when actor updates self", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@test.com",
      role: UserRole.SUPER_ADMIN,
    })
    mockPrisma.user.update.mockResolvedValue(userRow)
    await updateUser(
      1,
      {
        email: "a@test.com",
        name: "Alice",
        role: UserRole.OPERATOR,
      },
      { actorId: 1 }
    )
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: UserRole.SUPER_ADMIN }),
      })
    )
  })

  it("updateUser skips email check when email unchanged", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@test.com",
      role: UserRole.OPERATOR,
    })
    mockPrisma.user.update.mockResolvedValue(userRow)
    await updateUser(1, {
      email: "a@test.com",
      name: "Alice Updated",
      role: UserRole.VIEWER,
    })
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
  })

  it("updateUser updates without password change", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@test.com",
      role: UserRole.OPERATOR,
    })
    mockPrisma.user.update.mockResolvedValue(userRow)
    await updateUser(1, {
      email: "a@test.com",
      name: "Alice",
      role: UserRole.VIEWER,
    })
    expect(mockHashPassword).not.toHaveBeenCalled()
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      })
    )
  })

  it("updateAccount succeeds with locale update", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...userRow,
      passwordHash: "stored-hash",
    })
    mockPrisma.user.update.mockResolvedValue({ ...userRow, locale: "en" })
    const result = await updateAccount(1, {
      email: "a@test.com",
      name: "Alice",
      locale: "en",
    })
    expect(result.locale).toBe("en")
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: "en" }),
      })
    )
  })

  it("createAdminUser delegates to createUser", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue(userRow)
    await createAdminUser({
      email: "a@test.com",
      name: "Alice",
      password: "secret",
      passwordConfirm: "secret",
      role: UserRole.OPERATOR,
      mustChangePassword: false,
    })
    expect(mockPrisma.user.create).toHaveBeenCalled()
  })
})
