import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))
const mockGetHeadOrganizationId = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

vi.mock("@/lib/settings", () => ({
  getHeadOrganizationId: mockGetHeadOrganizationId,
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import {
  createOrganization,
  createSubdivision,
  deleteOrganization,
  deleteSubdivision,
  getOrganization,
  getSubdivision,
  listOrganizations,
  listSupervisedOrganizations,
  updateOrganization,
  updateSubdivision,
} from "@/lib/organizations"

describe("organizations index exports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHeadOrganizationId.mockResolvedValue(null)
  })

  it("listOrganizations includes subdivisions and order count", async () => {
    mockPrisma.organization.findMany.mockResolvedValue([{ id: 1 }])
    await listOrganizations()
    expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } })
    )
  })

  it("listSupervisedOrganizations excludes head organization", async () => {
    mockGetHeadOrganizationId.mockResolvedValue(99)
    mockPrisma.organization.findMany.mockResolvedValue([])
    await listSupervisedOrganizations()
    expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { not: 99 } } })
    )
  })

  it("listSupervisedOrganizations returns all orgs when head org unset", async () => {
    mockGetHeadOrganizationId.mockResolvedValue(null)
    mockPrisma.organization.findMany.mockResolvedValue([{ id: 1 }])
    await listSupervisedOrganizations()
    expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it("getOrganization loads by id", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 1 })
    await getOrganization(1)
    expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
  })

  it("getSubdivision loads by id", async () => {
    mockPrisma.subdivision.findUnique.mockResolvedValue({ id: 10 })
    await getSubdivision(10)
    expect(mockPrisma.subdivision.findUnique).toHaveBeenCalledWith({ where: { id: 10 } })
  })

  it("createOrganization persists name and shortCode", async () => {
    mockPrisma.organization.create.mockResolvedValue({ id: 1 })
    await createOrganization({ name: "Org", shortCode: "O1" })
    expect(mockPrisma.organization.create).toHaveBeenCalledWith({
      data: { name: "Org", shortCode: "O1" },
    })
  })

  it("createOrganization nulls shortCode when omitted", async () => {
    mockPrisma.organization.create.mockResolvedValue({ id: 2 })
    await createOrganization({ name: "Org" })
    expect(mockPrisma.organization.create).toHaveBeenCalledWith({
      data: { name: "Org", shortCode: null },
    })
  })

  it("updateOrganization updates fields", async () => {
    mockPrisma.organization.update.mockResolvedValue({ id: 1 })
    await updateOrganization(1, { name: "Updated", shortCode: null })
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Updated", shortCode: null },
    })
  })

  it("deleteOrganization throws ORG_HAS_ORDERS when orders exist", async () => {
    mockPrisma.order.count.mockResolvedValue(1)
    await expect(deleteOrganization(1)).rejects.toThrow("ORG_HAS_ORDERS")
    expect(mockPrisma.organization.delete).not.toHaveBeenCalled()
  })

  it("deleteOrganization removes org when no orders", async () => {
    mockPrisma.order.count.mockResolvedValue(0)
    mockPrisma.organization.delete.mockResolvedValue({ id: 1 })
    await deleteOrganization(1)
    expect(mockPrisma.organization.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it("createSubdivision links to organization", async () => {
    mockPrisma.subdivision.create.mockResolvedValue({ id: 10 })
    await createSubdivision(1, "Sub A")
    expect(mockPrisma.subdivision.create).toHaveBeenCalledWith({
      data: { organizationId: 1, name: "Sub A" },
    })
  })

  it("updateSubdivision updates name", async () => {
    mockPrisma.subdivision.update.mockResolvedValue({ id: 10 })
    await updateSubdivision(10, "Renamed")
    expect(mockPrisma.subdivision.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { name: "Renamed" },
    })
  })

  it("deleteSubdivision removes subdivision", async () => {
    mockPrisma.subdivision.delete.mockResolvedValue({ id: 10 })
    await deleteSubdivision(10)
    expect(mockPrisma.subdivision.delete).toHaveBeenCalledWith({ where: { id: 10 } })
  })
})
