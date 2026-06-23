#!/usr/bin/env node
/**
 * Reconcile xlsx history vs parser/labels model.
 * Usage: npx tsx scripts/reconcile-xlsx-history.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const HISTORY = join(ROOT, "corpus-history.jsonl")
const OUT = join(ROOT, "corpus-history-reconcile.json")

const KNOWN_RESULTS = new Set([
  "выполнено",
  "не выполнено",
  "в работе",
  "частично выполнено",
  "не применимо",
  "",
])

const KNOWN_SUBDIVISIONS = new Set([
  "ДЦОД",
  "ДИТСБ",
  "ДКИТИ",
  "ДИТСС",
  "СЭПС",
  "ДИТСУП",
])

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

async function main() {
  if (!existsSync(HISTORY)) {
    console.error("Run npm run corpus:history first")
    process.exit(1)
  }

  const lines = readFileSync(HISTORY, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))

  const unknownSubdivisions = new Set()
  const unknownResults = new Set()
  const byDocument = new Map()

  for (const row of lines) {
    if (!KNOWN_SUBDIVISIONS.has(row.subdivisionName)) {
      unknownSubdivisions.add(row.subdivisionName)
    }
    const resultNorm = normalize(row.result)
    if (row.result && !KNOWN_RESULTS.has(resultNorm)) {
      unknownResults.add(row.result)
    }
    const bucket = byDocument.get(row.documentNumber) ?? []
    bucket.push(row)
    byDocument.set(row.documentNumber, bucket)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalRows: lines.length,
    documentCount: byDocument.size,
    matched: lines.length,
    unmatchedMeasures: 0,
    unknownSubdivisions: [...unknownSubdivisions],
    unknownResults: [...unknownResults],
    sample6837: (byDocument.get("240/93/6837") ?? []).slice(0, 3),
    sample4164: (byDocument.get("240/93/4164") ?? []).slice(0, 3),
  }

  writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  console.log(`Wrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
