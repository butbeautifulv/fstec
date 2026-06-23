#!/usr/bin/env node
/**
 * Remove non-canonical appendix imports (DZO splits, short names, etc.).
 * Usage: npx tsx --env-file=.env.local scripts/cleanup-junk-appendices.mjs [--dry-run]
 */
import { PrismaClient } from "@prisma/client"
import { isCanonicalAppendixFile, isJunkAppendixFile } from "../lib/measure-imports/canonical-appendix.ts"

const dryRun = process.argv.includes("--dry-run")
const prisma = new PrismaClient()

async function main() {
  const appendices = await prisma.measureImport.findMany({
    where: { kind: "APPENDIX" },
    select: { id: true, originalName: true, documentNumber: true, status: true },
    orderBy: { id: "asc" },
  })

  const junk = appendices.filter((row) => isJunkAppendixFile(row.originalName))
  const keep = appendices.filter((row) => isCanonicalAppendixFile(row.originalName))

  console.log(
    JSON.stringify(
      {
        dryRun,
        totalAppendices: appendices.length,
        keep: keep.length,
        delete: junk.length,
        junkSample: junk.slice(0, 10).map((r) => r.originalName),
      },
      null,
      2
    )
  )

  if (!dryRun && junk.length > 0) {
    const result = await prisma.measureImport.deleteMany({
      where: { id: { in: junk.map((r) => r.id) } },
    })
    console.log(`Deleted ${result.count} junk appendix import(s)`)
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
