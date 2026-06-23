import { readFileSync, existsSync, copyFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { execSync } from "node:child_process"
import type { MeasureImportKind } from "@prisma/client"
import { PrismaClient } from "@prisma/client"
import {
  extractDocxParagraphsAsync,
  parseMeasureItemsFromParagraphs,
} from "../lib/measure-imports/parse-docx.js"
import { extractMetadata } from "../lib/measure-imports/extract-metadata.js"
import { buildParsedItems } from "../lib/measure-imports/build-parsed-items.js"
import { resolveLetterImportKind } from "../lib/measure-imports/resolve-import-kind.js"
import { resolveParseStatus } from "../lib/measure-imports/resolve-parse-status.js"
import { isCanonicalAppendixFile } from "../lib/measure-imports/canonical-appendix.js"
import { upsertMeasureFromImportItem } from "../lib/measures/upsert-from-import.js"
import { regulatoryDocStorageKey } from "../lib/regulatory-docs/config.js"
import {
  downloadRegulatoryDocBuffer,
  uploadRegulatoryDocBuffer,
} from "../lib/regulatory-docs/storage.js"
import { suggestRoutingForMeasures } from "../lib/measure-imports/suggest-routing.js"
import type { MeasureTag } from "../lib/measure-imports/tag-measure.js"

const prisma = new PrismaClient()

const ROOT = process.cwd()
const FULL_CORPUS = join(ROOT, ".external/240 93 6837")
const SLICE = join(ROOT, ".external/docx_examples/corpus")
const ORGS_PATH = join(ROOT, ".external/seed/orgs.json")
const ORGS_EXAMPLE = join(ROOT, ".external/seed/orgs.example.json")
const MANIFEST_PATH = join(ROOT, "prisma/seed-manifest.generated.json")

const LEGACY_ORG_NAMES = [
  "Тестовое ДЗО",
  "ФСТЭК",
  'ПАО «Ростех»',
  'ПАО «Сбербанк»',
  "Аэрофлот — Российские авиалинии",
  "Госкорпорация «Роскосмос»",
]

type OrgConfig = {
  headOrganization: {
    name: string
    shortCode: string
    subdivisions: string[]
  }
  supervisedOrganizations: Array<{ name: string; shortCode: string }>
}

type ManifestLetter = {
  folder: string
  documentNumber: string
  letterFile: string
  appendixFile?: string | null
  hasAppendixFile?: boolean
  measureCount?: number
  pattern?: string
  tier?: string
  seedByDefault?: boolean
}

type Manifest = {
  letters: ManifestLetter[]
  routingPairs?: ManifestLetter[]
}

type ImportJob = {
  label: string
  documentNumber: string
  kind: "letter" | "appendix"
  folder: string
  fileName: string
  parentDocumentNumber?: string
}

async function purgeImports() {
  if (process.env.SEED_PURGE_IMPORTS !== "1") return
  const result = await prisma.measureImport.deleteMany()
  console.log(`purgeImports: removed ${result.count} import(s)`)
}

async function findExistingImport(job: ImportJob) {
  if (job.kind === "letter") {
    return prisma.measureImport.findFirst({
      where: {
        kind: "LETTER",
        originalName: job.fileName,
        documentNumber: job.documentNumber,
        parentImportId: null,
        status: { in: ["IMPORTED", "PARSED"] },
      },
      orderBy: { id: "desc" },
      select: { id: true, documentNumber: true, status: true },
    })
  }

  return prisma.measureImport.findFirst({
    where: {
      kind: "APPENDIX",
      originalName: job.fileName,
      parentImport: {
        documentNumber: job.parentDocumentNumber ?? job.documentNumber,
      },
      status: { in: ["IMPORTED", "PARSED"] },
    },
    orderBy: { id: "desc" },
    select: { id: true, documentNumber: true, status: true },
  })
}

function accessToken(): string {
  return randomBytes(24).toString("base64url")
}

function ensureOrgsConfig(): OrgConfig {
  if (!existsSync(ORGS_PATH)) {
    if (!existsSync(ORGS_EXAMPLE)) {
      throw new Error(`Missing ${ORGS_EXAMPLE}`)
    }
    mkdirSync(join(ROOT, ".external/seed"), { recursive: true })
    copyFileSync(ORGS_EXAMPLE, ORGS_PATH)
    console.log(`Created ${ORGS_PATH} from example`)
  }
  return JSON.parse(readFileSync(ORGS_PATH, "utf8")) as OrgConfig
}

function allowlistOrgNames(config: OrgConfig): Set<string> {
  const names = new Set<string>([config.headOrganization.name])
  for (const org of config.supervisedOrganizations) {
    names.add(org.name)
  }
  return names
}

async function purgeSeedOrgs(config: OrgConfig) {
  const allowlist = allowlistOrgNames(config)
  const purgeUnknown = process.env.SEED_PURGE_UNKNOWN_ORGS === "true"

  const toDelete = await prisma.organization.findMany({
    where: {
      OR: [
        { shortCode: { startsWith: "DEV-" } },
        { name: { in: LEGACY_ORG_NAMES } },
        ...(purgeUnknown
          ? [{ name: { notIn: [...allowlist] } }]
          : []),
      ],
    },
    select: { id: true, name: true },
  })

  if (toDelete.length === 0) {
    console.log("purgeSeedOrgs: nothing to remove")
    return
  }

  const ids = toDelete.map((o) => o.id)
  await prisma.order.deleteMany({ where: { organizationId: { in: ids } } })
  await prisma.organization.deleteMany({ where: { id: { in: ids } } })
  console.log(
    `purgeSeedOrgs: removed ${toDelete.length} org(s): ${toDelete.map((o) => o.name).join(", ")}`
  )
}

async function seedOrganizations(config: OrgConfig) {
  const head = await prisma.organization.upsert({
    where: { name: config.headOrganization.name },
    update: { shortCode: config.headOrganization.shortCode },
    create: {
      name: config.headOrganization.name,
      shortCode: config.headOrganization.shortCode,
    },
  })

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { headOrganizationId: head.id },
    create: { id: 1, timezone: "Europe/Moscow", headOrganizationId: head.id },
  })

  await prisma.subdivision.deleteMany({
    where: {
      organizationId: head.id,
      name: { notIn: config.headOrganization.subdivisions },
    },
  })

  for (const name of config.headOrganization.subdivisions) {
    await prisma.subdivision.upsert({
      where: { organizationId_name: { organizationId: head.id, name } },
      update: {},
      create: { organizationId: head.id, name },
    })
  }

  await prisma.contactPerson.deleteMany({ where: { organizationId: head.id } })
  await prisma.contactPerson.create({
    data: {
      organizationId: head.id,
      fullName: "Ответственный за ИБ",
      position: "Начальник отдела",
      email: "svo.security@example.local",
      role: "PRIMARY",
    },
  })

  await prisma.accessLink.deleteMany({ where: { organizationId: head.id } })
  await prisma.accessLink.create({ data: { organizationId: head.id, token: accessToken() } })
  const headSubs = await prisma.subdivision.findMany({ where: { organizationId: head.id } })
  for (const sub of headSubs) {
    await prisma.accessLink.create({
      data: { organizationId: head.id, subdivisionId: sub.id, token: accessToken() },
    })
  }

  const supervised = []
  for (const org of config.supervisedOrganizations) {
    const row = await prisma.organization.upsert({
      where: { name: org.name },
      update: { shortCode: org.shortCode },
      create: { name: org.name, shortCode: org.shortCode },
    })

    await prisma.subdivision.deleteMany({ where: { organizationId: row.id } })
    await prisma.contactPerson.deleteMany({ where: { organizationId: row.id } })
    await prisma.contactPerson.create({
      data: {
        organizationId: row.id,
        fullName: "Ответственный за ИБ",
        position: "Специалист",
        email: `${org.shortCode.toLowerCase()}@example.local`,
        role: "PRIMARY",
      },
    })
    await prisma.accessLink.deleteMany({ where: { organizationId: row.id } })
    await prisma.accessLink.create({
      data: { organizationId: row.id, token: accessToken() },
    })
    supervised.push(row)
  }

  return { head, supervised }
}

function resolveFilePath(folder: string, fileName: string): string | null {
  const corpusPath = join(FULL_CORPUS, folder, fileName)
  if (existsSync(corpusPath)) return corpusPath
  const slicePath = join(SLICE, fileName)
  if (existsSync(slicePath)) return slicePath
  return null
}

async function createImportUpload(
  adminId: number,
  buffer: Buffer,
  originalName: string,
  parentImportId: number | null
) {
  const kind: MeasureImportKind = parentImportId ? "APPENDIX" : "LETTER"
  const record = await prisma.measureImport.create({
    data: {
      kind,
      status: "UPLOADED",
      originalName: originalName.slice(0, 255),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: buffer.length,
      storageKey: "pending",
      uploadedById: adminId,
      parentImportId,
      uploadedVia: "MANUAL",
    },
  })

  const storageKey = regulatoryDocStorageKey(record.id, originalName)
  const { sha256 } = await uploadRegulatoryDocBuffer(storageKey, buffer, record.mimeType)

  return prisma.measureImport.update({
    where: { id: record.id },
    data: { storageKey, sha256 },
  })
}

async function parseImport(id: number, fallbackDocumentNumber?: string) {
  const record = await prisma.measureImport.findUnique({ where: { id } })
  if (!record) throw new Error("NOT_FOUND")

  const buffer = await downloadRegulatoryDocBuffer(record.storageKey)
  const paragraphs = await extractDocxParagraphsAsync(buffer)
  const rawItems = parseMeasureItemsFromParagraphs(paragraphs)
  const metadata = extractMetadata(paragraphs, record.originalName, rawItems.length)
  const kind = resolveLetterImportKind({
    paragraphs,
    originalName: record.originalName,
    parentImportId: record.parentImportId,
    rawMeasureCount: rawItems.length,
  })

  const parsedItems = buildParsedItems({
    paragraphs,
    originalName: record.originalName,
    parentImportId: record.parentImportId,
    metadata,
  })

  const { status, parseError } = resolveParseStatus({
    parsedItemCount: parsedItems.length,
    needsAppendix: metadata.needsAppendix,
    parentImportId: record.parentImportId,
  })

  const documentNumber =
    metadata.documentNumber ?? fallbackDocumentNumber ?? null

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
        documentNumber,
        title: metadata.title,
        reportDueAt: metadata.reportDueAt,
        needsAppendix: metadata.needsAppendix,
        parseError,
      },
    })
  })
}

async function commitImport(importId: number, createdById: number) {
  const record = await prisma.measureImport.findUnique({
    where: { id: importId },
    include: { items: { where: { included: true }, orderBy: { sortOrder: "asc" } } },
  })
  if (!record || record.items.length === 0) throw new Error("NO_ITEMS")

  await prisma.$transaction(async (tx) => {
    for (const item of record.items) {
      await upsertMeasureFromImportItem(item, importId, createdById, tx)
    }
    await tx.measureImport.update({
      where: { id: importId },
      data: { status: "IMPORTED", importedAt: new Date() },
    })
  })
}

async function importDocx(
  adminId: number,
  job: ImportJob,
  parentImportId?: number
): Promise<{ id: number; documentNumber: string | null; committed: boolean }> {
  const existing = await findExistingImport(job)
  if (existing) {
    if (job.documentNumber && !existing.documentNumber) {
      await prisma.measureImport.update({
        where: { id: existing.id },
        data: { documentNumber: job.documentNumber },
      })
    }
    return {
      id: existing.id,
      documentNumber: existing.documentNumber ?? job.documentNumber,
      committed: existing.status === "IMPORTED",
    }
  }

  const filePath = resolveFilePath(job.folder, job.fileName)
  if (!filePath) {
    throw new Error(`DOCX not found: ${job.folder}/${job.fileName}`)
  }

  const buffer = readFileSync(filePath)
  const uploaded = await createImportUpload(
    adminId,
    buffer,
    job.fileName,
    parentImportId ?? null
  )
  await parseImport(uploaded.id, job.documentNumber)

  const afterParse = await prisma.measureImport.findUnique({
    where: { id: uploaded.id },
    select: {
      id: true,
      documentNumber: true,
      status: true,
      _count: { select: { items: true } },
    },
  })
  if (afterParse?.status !== "PARSED" || afterParse._count.items === 0) {
    if (afterParse?.status === "PARSED" && afterParse._count.items === 0) {
      console.log(`  skip commit ${job.label}: routing shell (0 items)`)
    } else {
      console.warn(`  skip commit ${job.label}: status=${afterParse?.status}`)
    }
    return {
      id: uploaded.id,
      documentNumber: afterParse?.documentNumber ?? job.documentNumber,
      committed: false,
    }
  }

  await commitImport(uploaded.id, adminId)
  return {
    id: uploaded.id,
    documentNumber: afterParse.documentNumber ?? job.documentNumber,
    committed: true,
  }
}

function ensureManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    if (existsSync(FULL_CORPUS)) {
      console.log("Building seed manifest…")
      execSync("npx tsx scripts/build-seed-manifest.mjs", { stdio: "inherit", cwd: ROOT })
    }
  }
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing ${MANIFEST_PATH} — run npm run corpus:build-seed-manifest`)
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest
}

function selectImportJobs(manifest: Manifest): ImportJob[] {
  const importAll = process.env.SEED_IMPORT_ALL === "1"
  const letters = manifest.letters ?? []
  const selectedLetters = importAll
    ? letters.filter((l) => (l.measureCount ?? 0) > 0 || l.pattern === "routing")
    : letters.filter((l) => l.seedByDefault)

  const jobs: ImportJob[] = []
  const seen = new Set<string>()

  for (const letter of selectedLetters) {
    const key = `letter:${letter.documentNumber}`
    if (seen.has(key)) continue
    seen.add(key)
    jobs.push({
      label: letter.documentNumber,
      documentNumber: letter.documentNumber,
      kind: "letter",
      folder: letter.folder,
      fileName: letter.letterFile,
    })
  }

  for (const letter of selectedLetters) {
    if (!letter.appendixFile || !letter.hasAppendixFile) continue
    if (!isCanonicalAppendixFile(letter.appendixFile)) continue
    const key = `appendix:${letter.documentNumber}`
    if (seen.has(key)) continue
    seen.add(key)
    jobs.push({
      label: `${letter.documentNumber} appendix`,
      documentNumber: letter.documentNumber,
      kind: "appendix",
      folder: letter.folder,
      fileName: letter.appendixFile,
      parentDocumentNumber: letter.documentNumber,
    })
  }

  return jobs
}

async function verifyRouting(importId: number, organizationId: number) {
  const record = await prisma.measureImport.findUnique({
    where: { id: importId },
    include: { items: { where: { included: true }, orderBy: { sortOrder: "asc" } } },
  })
  if (!record) return

  const subdivisions = await prisma.subdivision.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const measures = record.items.map((item) => ({
    tags: item.tags as MeasureTag[],
    description: item.description ?? "",
  }))
  const suggestions = suggestRoutingForMeasures(measures, subdivisions)

  const networkItem = record.items.find((i) => i.tags.includes("network"))
  if (!networkItem) {
    console.warn("  routing check: no network-tagged item")
    return
  }

  const index = record.items.indexOf(networkItem)
  const top = suggestions.get(index)?.[0]
  console.log(
    `  routing check: network → ${top?.subdivisionName} (${top?.confidence})`
  )
}

function printGapSummary() {
  try {
    execSync("npx tsx scripts/corpus-gap-report.mjs", { stdio: "inherit", cwd: ROOT })
  } catch {
    console.warn("corpus-gap-report failed (corpus may be missing)")
  }
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    orderBy: { id: "asc" },
  })
  if (!admin) {
    throw new Error("Admin user not found — run npm run db:reset first")
  }

  if (!existsSync(FULL_CORPUS) && !existsSync(SLICE)) {
    throw new Error(
      `No local corpus found at ${FULL_CORPUS}\nRun: npm run corpus:prepare-slice`
    )
  }

  const orgConfig = ensureOrgsConfig()
  await purgeSeedOrgs(orgConfig)
  await purgeImports()
  const { head, supervised } = await seedOrganizations(orgConfig)

  const manifest = ensureManifest()
  const jobs = selectImportJobs(manifest)
  console.log(`Importing ${jobs.length} document(s)…`)

  const importIds: Record<string, number> = {}
  let committed = 0

  for (const job of jobs) {
    if (job.kind === "appendix") {
      const parentId = importIds[job.parentDocumentNumber!]
      if (parentId == null) {
        console.warn(`  skip appendix ${job.label}: parent missing`)
        continue
      }
      const result = await importDocx(admin.id, job, parentId)
      const tag = result.committed ? " (committed)" : ""
      console.log(`  ${job.kind} ${job.label} → id=${result.id}${tag}`)
      if (result.committed) committed++
      continue
    }

    const result = await importDocx(admin.id, job)
    importIds[job.documentNumber] = result.id
    console.log(
      `  ${job.kind} ${job.label} → id=${result.id}${result.committed ? " (committed)" : ""}`
    )
    if (result.committed) committed++
  }

  const routingId = importIds["240/93/6837"]
  if (routingId != null) {
    await verifyRouting(routingId, head.id)
  }

  console.log("\nCorpus seed complete:")
  console.log(`  • head: ${head.name} (id=${head.id})`)
  console.log(`  • supervised DZO: ${supervised.length} org(s)`)
  for (const org of supervised) {
    console.log(`    - ${org.name}`)
  }
  console.log(`  • imports committed: ${committed}/${jobs.length}`)
  if (routingId != null) {
    console.log(`\nTest routing (head subdivisions):`)
    console.log(`  • import:  /panel/measures/imports/${routingId}`)
    console.log(`  • order:   /panel/orders/new?importId=${routingId}`)
    console.log(
      `  • API:     /api/measure-imports/${routingId}/routing-suggestions?organizationId=${head.id}`
    )
  }

  printGapSummary()

  if (process.env.SEED_XLSX_HISTORY === "1") {
    try {
      execSync("npx tsx --env-file=.env.local scripts/seed-xlsx-history.mjs", {
        stdio: "inherit",
        cwd: ROOT,
      })
    } catch {
      console.warn("seed-xlsx-history failed")
    }
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
