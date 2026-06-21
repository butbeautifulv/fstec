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
  ensureAppSettings,
  getAppSettings,
  getHeadOrganizationId,
  getPublicSettings,
  getPublicTimezone,
  updateAppSettings,
} from "@/lib/settings"

const settingsRow = {
  id: 1,
  timezone: "Europe/Moscow",
  locale: "ru",
  headOrganizationId: 5,
  headOrganization: { id: 5, name: "Head Org" },
}

describe("settings index exports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.appSettings.upsert.mockResolvedValue(settingsRow)
    mockPrisma.appSettings.findUnique.mockResolvedValue({
      headOrganizationId: 5,
    })
    mockPrisma.appSettings.findUniqueOrThrow.mockResolvedValue(settingsRow)
  })

  it("ensureAppSettings upserts default settings", async () => {
    await ensureAppSettings()
    expect(mockPrisma.appSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
  })

  it("getAppSettings ensures settings then loads with head org", async () => {
    const result = await getAppSettings()
    expect(result).toEqual(settingsRow)
    expect(mockPrisma.appSettings.upsert).toHaveBeenCalled()
  })

  it("getPublicSettings returns public fields only", async () => {
    const result = await getPublicSettings()
    expect(result).toEqual({
      timezone: "Europe/Moscow",
      locale: "ru",
      headOrganization: { id: 5, name: "Head Org" },
    })
  })

  it("getPublicSettings returns null headOrganization when unset", async () => {
    mockPrisma.appSettings.findUniqueOrThrow.mockResolvedValue({
      ...settingsRow,
      headOrganizationId: null,
      headOrganization: null,
    })
    const result = await getPublicSettings()
    expect(result.headOrganization).toBeNull()
  })

  it("getPublicTimezone returns timezone", async () => {
    await expect(getPublicTimezone()).resolves.toBe("Europe/Moscow")
  })

  it("getHeadOrganizationId returns cached head org id", async () => {
    await expect(getHeadOrganizationId()).resolves.toBe(5)
  })

  it("getHeadOrganizationId returns null when settings row missing", async () => {
    mockPrisma.appSettings.findUnique.mockResolvedValue(null)
    await expect(getHeadOrganizationId()).resolves.toBeNull()
  })

  it("updateAppSettings throws NOT_FOUND for unknown head organization", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null)
    await expect(
      updateAppSettings({ headOrganizationId: 999 })
    ).rejects.toThrow("NOT_FOUND")
  })

  it("updateAppSettings persists changes", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 5 })
    mockPrisma.appSettings.update.mockResolvedValue(settingsRow)
    await updateAppSettings({ timezone: "UTC", locale: "en" })
    expect(mockPrisma.appSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { timezone: "UTC", locale: "en" },
      })
    )
  })

  it("updateAppSettings supports partial timezone-only update", async () => {
    mockPrisma.appSettings.update.mockResolvedValue(settingsRow)
    await updateAppSettings({ timezone: "UTC" })
    expect(mockPrisma.appSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { timezone: "UTC" },
      })
    )
  })

  it("updateAppSettings supports headOrganizationId-only update", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: 8 })
    mockPrisma.appSettings.update.mockResolvedValue(settingsRow)
    await updateAppSettings({ headOrganizationId: 8 })
    expect(mockPrisma.appSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { headOrganizationId: 8 },
      })
    )
  })
})
