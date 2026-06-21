import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import {
  createContact,
  deleteContact,
  listOrganizationContacts,
  listSubdivisionContacts,
  resolveContactsForTarget,
  updateContact,
} from "@/lib/contacts"

describe("contacts CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createContact validates subdivision", async () => {
    mockPrisma.subdivision.findFirst.mockResolvedValue(null)
    await expect(
      createContact({
        organizationId: 1,
        subdivisionId: 99,
        fullName: "Test",
        email: "a@test.com",
        role: "RESPONSIBLE",
      })
    ).rejects.toThrow("NOT_FOUND")
  })

  it("createContact throws when primary exists", async () => {
    mockPrisma.subdivision.findFirst.mockResolvedValue({ id: 10 })
    mockPrisma.contactPerson.findFirst.mockResolvedValue({ id: 5 })
    await expect(
      createContact({
        organizationId: 1,
        subdivisionId: 10,
        fullName: "Test",
        email: "a@test.com",
        role: "PRIMARY",
      })
    ).rejects.toThrow("PRIMARY_CONTACT_EXISTS")
  })

  it("createContact succeeds", async () => {
    mockPrisma.subdivision.findFirst.mockResolvedValue({ id: 10 })
    mockPrisma.contactPerson.findFirst.mockResolvedValue(null)
    mockPrisma.contactPerson.create.mockResolvedValue({ id: 1, fullName: "Test" })
    const result = await createContact({
      organizationId: 1,
      subdivisionId: 10,
      fullName: "Test",
      email: "a@test.com",
      role: "RESPONSIBLE",
    })
    expect(result.id).toBe(1)
  })

  it("updateContact throws NOT_FOUND", async () => {
    mockPrisma.contactPerson.findUnique.mockResolvedValue(null)
    await expect(updateContact(1, { fullName: "X" })).rejects.toThrow("NOT_FOUND")
  })

  it("deleteContact throws NOT_FOUND", async () => {
    mockPrisma.contactPerson.findUnique.mockResolvedValue(null)
    await expect(deleteContact(1)).rejects.toThrow("NOT_FOUND")
  })

  it("resolveContactsForTarget prefers subdivision contacts", async () => {
    mockPrisma.contactPerson.findMany.mockResolvedValueOnce([
      {
        email: "sub@test.com",
        role: "PRIMARY",
        fullName: "Sub",
      },
    ])
    const result = await resolveContactsForTarget({
      organizationId: 1,
      subdivisionId: 10,
    })
    expect(result).toHaveLength(1)
    expect(mockPrisma.contactPerson.findMany).toHaveBeenCalledTimes(1)
  })

  it("resolveContactsForTarget falls back to organization contacts", async () => {
    mockPrisma.contactPerson.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          email: "org@test.com",
          role: "PRIMARY",
          fullName: "Org Contact",
        },
      ])
    const result = await resolveContactsForTarget({
      organizationId: 1,
      subdivisionId: 10,
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.email).toBe("org@test.com")
    expect(mockPrisma.contactPerson.findMany).toHaveBeenCalledTimes(2)
  })

  it("resolveContactsForTarget loads organization contacts when subdivisionId is null", async () => {
    mockPrisma.contactPerson.findMany.mockResolvedValueOnce([
      { email: "org@test.com", role: "PRIMARY", fullName: "Org" },
    ])
    const result = await resolveContactsForTarget({
      organizationId: 1,
      subdivisionId: null,
    })
    expect(result).toHaveLength(1)
    expect(mockPrisma.contactPerson.findMany).toHaveBeenCalledTimes(1)
  })

  it("updateContact succeeds", async () => {
    mockPrisma.contactPerson.findUnique.mockResolvedValue({
      id: 1,
      organizationId: 1,
      subdivisionId: 10,
      role: "RESPONSIBLE",
    })
    mockPrisma.contactPerson.findFirst.mockResolvedValue(null)
    mockPrisma.contactPerson.update.mockResolvedValue({
      id: 1,
      fullName: "Updated",
    })
    const result = await updateContact(1, { fullName: "Updated" })
    expect(result.fullName).toBe("Updated")
  })

  it("updateContact succeeds with all optional fields", async () => {
    mockPrisma.contactPerson.findUnique.mockResolvedValue({
      id: 1,
      organizationId: 1,
      subdivisionId: null,
      role: "PRIMARY",
    })
    mockPrisma.contactPerson.findFirst.mockResolvedValue(null)
    mockPrisma.contactPerson.update.mockResolvedValue({ id: 1 })

    await updateContact(1, {
      fullName: "New Name",
      position: "Lead",
      email: "new@test.com",
      role: "PRIMARY",
      isActive: false,
    })

    expect(mockPrisma.contactPerson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: "New Name",
          position: "Lead",
          email: "new@test.com",
          role: "PRIMARY",
          isActive: false,
        }),
      })
    )
  })

  it("updateContact allows keeping PRIMARY role for same contact", async () => {
    mockPrisma.contactPerson.findUnique.mockResolvedValue({
      id: 1,
      organizationId: 1,
      subdivisionId: null,
      role: "PRIMARY",
    })
    mockPrisma.contactPerson.findFirst.mockResolvedValue(null)
    mockPrisma.contactPerson.update.mockResolvedValue({ id: 1, role: "PRIMARY" })

    await updateContact(1, { role: "PRIMARY", fullName: "Same Primary" })
    expect(mockPrisma.contactPerson.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { not: 1 } }),
      })
    )
  })

  it("listOrganizationContacts queries org scope", async () => {
    mockPrisma.contactPerson.findMany.mockResolvedValue([{ id: 1 }])
    await listOrganizationContacts(5)
    expect(mockPrisma.contactPerson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 5, subdivisionId: null },
      })
    )
  })

  it("listSubdivisionContacts queries subdivision scope", async () => {
    mockPrisma.contactPerson.findMany.mockResolvedValue([{ id: 2 }])
    await listSubdivisionContacts(12)
    expect(mockPrisma.contactPerson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subdivisionId: 12 },
      })
    )
  })

  it("deleteContact succeeds", async () => {
    mockPrisma.contactPerson.findUnique.mockResolvedValue({ id: 1 })
    mockPrisma.contactPerson.delete.mockResolvedValue({ id: 1 })
    await deleteContact(1)
    expect(mockPrisma.contactPerson.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
