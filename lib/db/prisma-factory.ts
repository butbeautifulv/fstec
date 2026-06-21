import { PrismaClient } from "@prisma/client"

export const REQUIRED_PRISMA_DELEGATES = [
  "appSettings",
  "reportLink",
  "responseAttachment",
  "measureImport",
  "emailDelivery",
  "contactPerson",
] as const

export function createPrismaClient(databaseUrl?: string) {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
  })
}

export function isStaleClient(client: PrismaClient) {
  return REQUIRED_PRISMA_DELEGATES.some((delegate) => !(delegate in client))
}
