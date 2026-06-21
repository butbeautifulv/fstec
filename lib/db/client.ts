import { PrismaClient } from "@prisma/client"
import { createPrismaClient, isStaleClient } from "@/lib/db/prisma-factory"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaRead: PrismaClient | undefined
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

function getPrismaReadClient() {
  const readUrl = process.env.DATABASE_READ_URL?.trim()
  if (!readUrl) return getPrismaClient()

  const existing = globalForPrisma.prismaRead
  if (existing && !isStaleClient(existing)) return existing

  const client = createPrismaClient(readUrl)
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaRead = client
  }
  return client
}

export const prisma = getPrismaClient()
export const prismaRead = getPrismaReadClient()
