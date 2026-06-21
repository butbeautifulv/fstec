import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PrismaClient } from "@prisma/client"

const mockClient = vi.hoisted(() => ({ kind: "write" }))
const mockReadClient = vi.hoisted(() => ({ kind: "read" }))
const mockCreatePrismaClient = vi.hoisted(() => vi.fn())
const mockIsStaleClient = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db/prisma-factory", () => ({
  createPrismaClient: mockCreatePrismaClient,
  isStaleClient: mockIsStaleClient,
}))

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaRead?: PrismaClient
}

describe("db client", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    delete globalForPrisma.prisma
    delete globalForPrisma.prismaRead
    mockCreatePrismaClient.mockReset()
    mockIsStaleClient.mockReturnValue(false)
    mockCreatePrismaClient.mockReturnValue(mockClient as never)
  })

  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    delete globalForPrisma.prisma
    delete globalForPrisma.prismaRead
  })

  it("creates prisma via createPrismaClient", async () => {
    const { prisma } = await import("@/lib/db/client")
    expect(mockCreatePrismaClient).toHaveBeenCalledWith()
    expect(prisma).toBe(mockClient)
  })

  it("stores prisma on global in development", async () => {
    vi.stubEnv("NODE_ENV", "development")
    await import("@/lib/db/client")
    expect(globalForPrisma.prisma).toBe(mockClient)
  })

  it("recreates stale prisma client", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const stale = { stale: true }
    const fresh = { fresh: true }
    globalForPrisma.prisma = stale as never
    mockIsStaleClient.mockReturnValue(true)
    mockCreatePrismaClient.mockReturnValue(fresh as never)

    const { prisma } = await import("@/lib/db/client")
    expect(prisma).toBe(fresh)
  })

  it("uses write client for reads when DATABASE_READ_URL is unset", async () => {
    const { prisma, prismaRead } = await import("@/lib/db/client")
    expect(prismaRead).toBe(prisma)
    expect(mockCreatePrismaClient).toHaveBeenCalledTimes(1)
  })

  it("creates separate read client when DATABASE_READ_URL is set", async () => {
    vi.stubEnv("DATABASE_READ_URL", "postgresql://read@localhost/db")
    mockCreatePrismaClient
      .mockReturnValueOnce(mockClient as never)
      .mockReturnValueOnce(mockReadClient as never)

    const { prisma, prismaRead } = await import("@/lib/db/client")
    expect(prisma).toBe(mockClient)
    expect(prismaRead).toBe(mockReadClient)
    expect(mockCreatePrismaClient).toHaveBeenNthCalledWith(
      2,
      "postgresql://read@localhost/db"
    )
  })

  it("does not store clients on global in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    await import("@/lib/db/client")
    expect(globalForPrisma.prisma).toBeUndefined()
  })

  it("recreates stale read client", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DATABASE_READ_URL", "postgresql://read@localhost/db")
    const staleRead = { stale: true }
    const freshRead = { fresh: true }
    globalForPrisma.prismaRead = staleRead as never
    mockIsStaleClient.mockReturnValue(true)
    mockCreatePrismaClient
      .mockReturnValueOnce(mockClient as never)
      .mockReturnValueOnce(freshRead as never)

    const { prismaRead } = await import("@/lib/db/client")
    expect(prismaRead).toBe(freshRead)
  })
})
