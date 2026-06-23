#!/usr/bin/env node
/**
 * Export measure import errors classified against seed manifest.
 * Usage: npx tsx --env-file=.env.local scripts/export-import-errors.mjs [--out-dir .]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const MANIFEST_PATH = join(ROOT, "prisma/seed-manifest.generated.json")

const outArg = process.argv.indexOf("--out-dir")
const OUT_DIR = outArg >= 0 ? process.argv[outArg + 1] : ROOT

function buildManifestIndex(manifest) {
  const importAll = process.env.SEED_IMPORT_ALL === "1"
  const letters = importAll
    ? manifest.letters.filter((l) => (l.measureCount ?? 0) > 0 || l.pattern === "routing")
    : manifest.letters.filter((l) => l.seedByDefault)

  const letterFiles = new Set(letters.map((l) => l.letterFile))
  const appendixFiles = new Set(
    letters.filter((l) => l.appendixFile).map((l) => l.appendixFile)
  )
  const letterByFile = new Map(letters.map((l) => [l.letterFile, l]))
  const appendixByFile = new Map(
    letters.filter((l) => l.appendixFile).map((l) => [l.appendixFile, l])
  )

  return { letters, letterFiles, appendixFiles, letterByFile, appendixByFile }
}

function inManifest(row, index) {
  if (row.kind === "LETTER") return index.letterFiles.has(row.originalName)
  return index.appendixFiles.has(row.originalName)
}

function manifestDocNumber(row, index) {
  if (row.kind === "LETTER") {
    return index.letterByFile.get(row.originalName)?.documentNumber ?? null
  }
  return index.appendixByFile.get(row.originalName)?.documentNumber ?? null
}

function classifyRow(row, index, seenCanonical) {
  const key = `${row.kind}|${row.originalName}`
  const manifestMatch = inManifest(row, index)

  if (!manifestMatch) {
    return "junk"
  }

  if (seenCanonical.has(key)) {
    return "duplicate"
  }

  if (
    row.kind === "LETTER" &&
    row.needsAppendix &&
    row._count.items === 0 &&
    (row.status === "PARSED" ||
      (row.status === "FAILED" && row.parseError === "NO_ITEMS_FOUND"))
  ) {
    return seenCanonical.has(key) ? "duplicate" : "routing_letter"
  }

  if (row.status === "FAILED") {
    return "real_failure"
  }

  seenCanonical.add(key)
  return "canonical"
}

function csvEscape(value) {
  const s = value == null ? "" : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error("Missing manifest:", MANIFEST_PATH)
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  const index = buildManifestIndex(manifest)
  const prisma = new PrismaClient()

  const imports = await prisma.measureImport.findMany({
    include: {
      parentImport: { select: { documentNumber: true, originalName: true } },
      _count: { select: { items: true, measures: true } },
    },
    orderBy: [{ documentNumber: "asc" }, { kind: "asc" }, { id: "asc" }],
  })

  const seenCanonical = new Set()
  const rows = imports.map((row) => {
    const classification = classifyRow(row, index, seenCanonical)
    if (classification === "canonical") {
      seenCanonical.add(`${row.kind}|${row.originalName}`)
    }
    return {
      id: row.id,
      documentNumber: row.documentNumber,
      manifestDocumentNumber: manifestDocNumber(row, index),
      kind: row.kind,
      originalName: row.originalName,
      title: row.title,
      status: row.status,
      parseError: row.parseError,
      needsAppendix: row.needsAppendix,
      itemsCount: row._count.items,
      measuresCount: row._count.measures,
      parentDocumentNumber: row.parentImport?.documentNumber ?? null,
      parentOriginalName: row.parentImport?.originalName ?? null,
      inManifest: inManifest(row, index),
      classification,
      createdAt: row.createdAt.toISOString(),
    }
  })

  // Re-classify: first occurrence per canonical key wins canonical, rest duplicate
  const firstByKey = new Map()
  for (const row of rows) {
    if (!row.inManifest) continue
    const key = `${row.kind}|${row.originalName}`
    if (!firstByKey.has(key)) {
      firstByKey.set(key, row.id)
    } else if (row.id !== firstByKey.get(key)) {
      row.classification =
        row.classification === "routing_letter" || row.classification === "real_failure"
          ? row.classification
          : "duplicate"
    }
  }

  const summary = rows.reduce((acc, row) => {
    acc[row.classification] = (acc[row.classification] ?? 0) + 1
    if (row.status === "FAILED") acc.failed += 1
    return acc
  }, { failed: 0 })

  const report = {
    generatedAt: new Date().toISOString(),
    manifestPath: MANIFEST_PATH,
    seedImportAll: process.env.SEED_IMPORT_ALL === "1",
    totalImports: rows.length,
    summary,
    rows,
  }

  const jsonPath = join(OUT_DIR, "import-errors-report.json")
  const csvPath = join(OUT_DIR, "import-errors-report.csv")
  writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  const headers = [
    "id",
    "documentNumber",
    "manifestDocumentNumber",
    "kind",
    "originalName",
    "title",
    "status",
    "parseError",
    "needsAppendix",
    "itemsCount",
    "measuresCount",
    "parentDocumentNumber",
    "inManifest",
    "classification",
    "createdAt",
  ]
  const csvLines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ]
  writeFileSync(csvPath, csvLines.join("\n"))

  console.log(JSON.stringify({ jsonPath, csvPath, summary, totalImports: rows.length }, null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
