import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PrismaClient } from "@prisma/client"

const { PrismaClientMock } = vi.hoisted(() => ({
  PrismaClientMock: vi.fn(function (this: Record<string, unknown>, options: unknown) {
    this.options = options
  }),
}))

vi.mock("@prisma/client", () => ({
  PrismaClient: PrismaClientMock,
}))

import {
  createPrismaClient,
  isStaleClient,
  REQUIRED_PRISMA_DELEGATES,
} from "@/lib/db/prisma-factory"

describe("REQUIRED_PRISMA_DELEGATES", () => {
  it("lists delegates added after initial schema", () => {
    expect(REQUIRED_PRISMA_DELEGATES).toContain("appSettings")
    expect(REQUIRED_PRISMA_DELEGATES).toContain("measureImport")
    expect(REQUIRED_PRISMA_DELEGATES.length).toBe(6)
  })
})

describe("isStaleClient", () => {
  it("returns true when required delegates are missing", () => {
    const stale = { user: {}, order: {} } as unknown as PrismaClient
    expect(isStaleClient(stale)).toBe(true)
  })

  it("returns false when all required delegates are present", () => {
    const fresh = Object.fromEntries(
      REQUIRED_PRISMA_DELEGATES.map((delegate) => [delegate, {}])
    ) as unknown as PrismaClient
    expect(isStaleClient(fresh)).toBe(false)
  })
})

describe("createPrismaClient", () => {
  beforeEach(() => {
    PrismaClientMock.mockClear()
  })

  it("instantiates PrismaClient with error-only logs in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    createPrismaClient()
    expect(PrismaClientMock).toHaveBeenCalledWith({ log: ["error"] })
  })

  it("instantiates PrismaClient with warn logs in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    createPrismaClient()
    expect(PrismaClientMock).toHaveBeenCalledWith({ log: ["error", "warn"] })
  })

  it("forwards optional database URL", () => {
    createPrismaClient("postgresql://read@localhost/db")
    expect(PrismaClientMock).toHaveBeenCalledWith({
      log: ["error"],
      datasources: { db: { url: "postgresql://read@localhost/db" } },
    })
  })
})
