import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

const REQUIRED_PRISMA_DELEGATES = [
  "appSettings",
  "reportLink",
  "responseAttachment",
] as const

function isStaleClient(client: PrismaClient) {
  return REQUIRED_PRISMA_DELEGATES.some((delegate) => !(delegate in client))
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma
  if (existing && !isStaleClient(existing)) return existing

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma = getPrismaClient()
