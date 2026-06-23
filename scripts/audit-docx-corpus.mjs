#!/usr/bin/env node
/**
 * Scan .external/240 93 6837 for DOCX letters and summarize parse patterns.
 * Usage: node scripts/audit-docx-corpus.mjs [--out audit-report.json]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CORPUS = join(ROOT, ".external/240 93 6837")

const LETTER_FILE_RE = /^240 93 \d+\.docx$/i
const SKIP_NAME_RE = /прилож|ответ|отчет/i

async function loadParser() {
  return import(join(ROOT, "lib/measure-imports/parse-docx.ts"))
}

function classifyPattern(items, paragraphs, hasAppendixFile) {
  const count = items.length
  if (count === 0) {
    if (hasAppendixFile || paragraphs.some((p) => /Приложение\s*:/i.test(p))) {
      return "routing"
    }
    return "zero"
  }
  const codes = items.map((i) => i.code).filter(Boolean)
  const hasSubs = codes.some((c) => c.includes("."))
  const hasBdu = codes.some((c) => c.startsWith("BDU:"))
  if (hasSubs && hasBdu) return "nested+bdu"
  if (hasSubs) return "nested"
  if (hasBdu) return "bdu_flat"
  return "flat"
}

async function main() {
  const outArg = process.argv.indexOf("--out")
  const outPath =
    outArg >= 0 ? process.argv[outArg + 1] : join(ROOT, "audit-report.json")

  const {
    extractDocxParagraphsAsync,
    parseMeasureItemsFromParagraphs,
    detectImportKind,
  } = await loadParser()

  const entries = []
  const patternCounts = {}

  if (!existsSync(CORPUS)) {
    console.error("Corpus not found:", CORPUS)
    process.exit(1)
  }

  for (const dirName of readdirSync(CORPUS)) {
    const dir = join(CORPUS, dirName)
    let files
    try {
      files = readdirSync(dir)
    } catch {
      continue
    }

    const letterFile = files.find(
      (f) => LETTER_FILE_RE.test(f) && !SKIP_NAME_RE.test(f)
    )
    if (!letterFile) continue

    const hasAppendixFile = files.some(
      (f) => /приложение/i.test(f) && f.endsWith(".docx") && !/ответствен/i.test(f)
    )

    try {
      const buffer = readFileSync(join(dir, letterFile))
      const paragraphs = await extractDocxParagraphsAsync(buffer)
      const items = parseMeasureItemsFromParagraphs(paragraphs)
      const kind = detectImportKind(paragraphs, letterFile)
      const pattern = classifyPattern(items, paragraphs, hasAppendixFile)
      patternCounts[pattern] = (patternCounts[pattern] ?? 0) + 1

      entries.push({
        folder: dirName,
        file: letterFile,
        kind,
        measureCount: items.length,
        pattern,
        hasAppendixFile,
        numberedParagraphs: paragraphs.filter((p) => /^\d/.test(p.trim())).length,
      })
    } catch (error) {
      entries.push({
        folder: dirName,
        file: letterFile,
        error: error instanceof Error ? error.message : String(error),
        pattern: "error",
      })
      patternCounts.error = (patternCounts.error ?? 0) + 1
    }
  }

  const summary = {
    scannedAt: new Date().toISOString(),
    total: entries.length,
    patternCounts,
    zeroCount: entries.filter((e) => e.pattern === "zero").length,
    routingCount: entries.filter((e) => e.pattern === "routing").length,
    entries,
  }

  writeFileSync(outPath, JSON.stringify(summary, null, 2))
  console.log(JSON.stringify({ total: summary.total, patternCounts, outPath }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
