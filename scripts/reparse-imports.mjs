#!/usr/bin/env node
/**
 * Re-parse committed measure imports after parser fixes.
 * Usage: npx tsx --env-file=.env.local scripts/reparse-imports.mjs [--dry-run]
 */
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const dryRun = process.argv.includes("--dry-run")
const prisma = new PrismaClient()

async function loadParser() {
  const [
    { extractDocxParagraphsAsync, parseMeasureItemsFromParagraphs },
    { extractMetadata },
    { buildParsedItems },
    { resolveLetterImportKind },
    { resolveParseStatus },
    { downloadRegulatoryDocBuffer },
    { upsertMeasureFromImportItem },
  ] = await Promise.all([
    import(join(ROOT, "lib/measure-imports/parse-docx.ts")),
    import(join(ROOT, "lib/measure-imports/extract-metadata.ts")),
    import(join(ROOT, "lib/measure-imports/build-parsed-items.ts")),
    import(join(ROOT, "lib/measure-imports/resolve-import-kind.ts")),
    import(join(ROOT, "lib/measure-imports/resolve-parse-status.ts")),
    import(join(ROOT, "lib/regulatory-docs/storage.ts")),
    import(join(ROOT, "lib/measures/upsert-from-import.ts")),
  ])
  return {
    extractDocxParagraphsAsync,
    parseMeasureItemsFromParagraphs,
    extractMetadata,
    buildParsedItems,
    resolveLetterImportKind,
    resolveParseStatus,
    downloadRegulatoryDocBuffer,
    upsertMeasureFromImportItem,
  }
}

async function parseImportRecord(id, parser) {
  const record = await prisma.measureImport.findUnique({ where: { id } })
  if (!record) throw new Error("NOT_FOUND")

  const buffer = await parser.downloadRegulatoryDocBuffer(record.storageKey)
  const paragraphs = await parser.extractDocxParagraphsAsync(buffer)
  const rawItems = parser.parseMeasureItemsFromParagraphs(paragraphs)
  const metadata = parser.extractMetadata(paragraphs, record.originalName, rawItems.length)
  const kind = parser.resolveLetterImportKind({
    paragraphs,
    originalName: record.originalName,
    parentImportId: record.parentImportId,
    rawMeasureCount: rawItems.length,
  })
  const parsedItems = parser.buildParsedItems({
    paragraphs,
    originalName: record.originalName,
    parentImportId: record.parentImportId,
    metadata,
  })
  const { status, parseError } = parser.resolveParseStatus({
    parsedItemCount: parsedItems.length,
    needsAppendix: metadata.needsAppendix,
    parentImportId: record.parentImportId,
  })

  await prisma.$transaction(async (tx) => {
    await tx.measureImportItem.deleteMany({ where: { importId: id } })
    if (parsedItems.length > 0) {
      await tx.measureImportItem.createMany({
        data: parsedItems.map((item) => ({
          importId: id,
          code: item.code,
          name: item.name,
          description: item.description,
          tags: item.tags,
          sortOrder: item.sortOrder,
          included: true,
        })),
      })
    }
    await tx.measureImport.update({
      where: { id },
      data: {
        kind,
        status,
        documentNumber: metadata.documentNumber,
        title: metadata.title,
        reportDueAt: metadata.reportDueAt,
        needsAppendix: metadata.needsAppendix,
        parseError,
      },
    })
  })

  return { status, itemCount: parsedItems.length }
}

async function commitImportRecord(importId, adminId, parser) {
  const record = await prisma.measureImport.findUnique({
    where: { id: importId },
    include: { items: { where: { included: true }, orderBy: { sortOrder: "asc" } } },
  })
  if (!record || record.items.length === 0) return false

  await prisma.$transaction(async (tx) => {
    for (const item of record.items) {
      await parser.upsertMeasureFromImportItem(item, importId, adminId, tx)
    }
    await tx.measureImport.update({
      where: { id: importId },
      data: { status: "IMPORTED", importedAt: new Date() },
    })
  })
  return true
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    orderBy: { id: "asc" },
  })
  if (!admin) throw new Error("Admin user not found")

  const parser = await loadParser()
  const imports = await prisma.measureImport.findMany({
    where: { status: { in: ["IMPORTED", "PARSED"] } },
    orderBy: { id: "asc" },
    select: { id: true, documentNumber: true, kind: true, status: true, originalName: true },
  })

  let parsed = 0
  let committed = 0
  let skipped = 0

  for (const record of imports) {
    if (dryRun) {
      console.log(`would reparse id=${record.id} ${record.documentNumber ?? record.originalName}`)
      continue
    }

    const wasImported = record.status === "IMPORTED"
    const { itemCount } = await parseImportRecord(record.id, parser)
    parsed += 1

    if (wasImported && itemCount > 0) {
      await commitImportRecord(record.id, admin.id, parser)
      committed += 1
      console.log(
        `  recommitted ${record.documentNumber ?? record.originalName} (${itemCount} items)`
      )
    } else if (itemCount === 0) {
      skipped += 1
    }
  }

  console.log(
    JSON.stringify({ dryRun, total: imports.length, parsed, committed, skipped }, null, 2)
  )
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
