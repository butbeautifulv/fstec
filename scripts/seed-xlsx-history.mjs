#!/usr/bin/env node
/**
 * Dev-only: seed order items with statuses from xlsx history (corpus-history.jsonl).
 * Usage: SEED_XLSX_HISTORY=1 npx tsx --env-file=.env.local scripts/seed-xlsx-history.mjs
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const HISTORY = join(ROOT, "corpus-history.jsonl")

const RESULT_TO_STATUS: Record<string, string> = {
  выполнено: "Выполнено",
  "не выполнено": "К исполнению",
  "в работе": "В работе",
  "частично выполнено": "В работе",
}

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

async function main() {
  if (process.env.SEED_XLSX_HISTORY !== "1") {
    console.log("Skip xlsx history seed (set SEED_XLSX_HISTORY=1)")
    return
  }

  if (!existsSync(HISTORY)) {
    console.error("Run npm run corpus:history first")
    process.exit(1)
  }

  const prisma = new PrismaClient()
  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    orderBy: { id: "asc" },
  })
  if (!admin) throw new Error("Admin not found")

  const statuses = await prisma.status.findMany()
  const statusByName = new Map(statuses.map((s) => [s.name, s.id]))

  const lines = readFileSync(HISTORY, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))

  const byDoc = new Map()
  for (const row of lines) {
    const bucket = byDoc.get(row.documentNumber) ?? []
    bucket.push(row)
    byDoc.set(row.documentNumber, bucket)
  }

  let seeded = 0
  for (const [documentNumber, rows] of byDoc) {
    const imp = await prisma.measureImport.findFirst({
      where: { documentNumber, status: "IMPORTED" },
      include: { measures: true },
    })
    if (!imp || imp.measures.length === 0) continue

    const head = await prisma.organization.findFirst({
      where: { shortCode: "SVO" },
      include: { subdivisions: true },
    })
    if (!head) continue

    const sub = head.subdivisions.find((s) => s.name === rows[0]?.subdivisionName)
    const order = await prisma.order.create({
      data: {
        title: `История: ${documentNumber}`,
        organizationId: head.id,
        issuedAt: new Date(),
        createdById: admin.id,
        sourceImportId: imp.id,
      },
    })

    for (const measure of imp.measures.slice(0, Math.min(imp.measures.length, rows.length))) {
      const row = rows[seeded % rows.length]
      const statusName = RESULT_TO_STATUS[normalize(row?.result)] ?? "К исполнению"
      const statusId = statusByName.get(statusName)
      if (!statusId) continue

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          measureId: measure.id,
          subdivisionId: sub?.id ?? null,
          statusId,
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
      seeded++
    }
  }

  console.log(`Xlsx history seed: ${seeded} order items`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
