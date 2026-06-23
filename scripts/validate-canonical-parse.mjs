#!/usr/bin/env node
/**
 * Validate canonical letter parsing across corpus manifest.
 * Usage: npx tsx scripts/validate-canonical-parse.mjs [--out canonical-parse-report.json]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CORPUS = join(ROOT, ".external/240 93 6837")
const MANIFEST = join(ROOT, "prisma/seed-manifest.generated.json")

const DUE_IN_TEXT_RE =
  /до\s+\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4}/i
const FOOTER_LEAK_RE =
  /По результатам выполнения|просим проинформировать ФСТЭК|редактируемом формате/i

async function main() {
  const outArg = process.argv.indexOf("--out")
  const outPath =
    outArg >= 0 ? process.argv[outArg + 1] : join(ROOT, "canonical-parse-report.json")

  if (!existsSync(CORPUS) || !existsSync(MANIFEST)) {
    console.error("Corpus or manifest missing")
    process.exit(1)
  }

  const {
    extractDocxParagraphsAsync,
    parseMeasureItemsFromParagraphs,
  } = await import(join(ROOT, "lib/measure-imports/parse-docx.ts"))
  const { extractMetadata } = await import(join(ROOT, "lib/measure-imports/extract-metadata.ts"))
  const { pickCanonicalAppendixFile } = await import(
    join(ROOT, "lib/measure-imports/canonical-appendix.ts")
  )

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"))
  const rows = []
  const failures = []

  for (const letter of manifest.letters) {
    const dir = join(CORPUS, letter.folder)
    const filePath = join(dir, letter.letterFile)
    if (!existsSync(filePath)) {
      failures.push({ documentNumber: letter.documentNumber, issue: "missing_file" })
      continue
    }

    const buffer = readFileSync(filePath)
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    const items = parseMeasureItemsFromParagraphs(paragraphs)
    const meta = extractMetadata(paragraphs, letter.letterFile, items.length)
    const text = paragraphs.join(" ")
    const hasDueInText = DUE_IN_TEXT_RE.test(text)
    const footerLeak = items.some((item) => FOOTER_LEAK_RE.test(item.description))
    const files = readdirSync(dir)
    const canonicalAppendix = pickCanonicalAppendixFile(files, letter.folder)
    const routingOk = letter.pattern === "routing" && items.length === 0

    const issues = []
    if (items.length === 0 && !routingOk) issues.push("zero_items")
    if (footerLeak) issues.push("footer_leak")
    if (hasDueInText && !meta.reportDueAt) issues.push("missing_report_due_at")

    const row = {
      documentNumber: letter.documentNumber,
      letterFile: letter.letterFile,
      pattern: letter.pattern,
      itemCount: items.length,
      footerLeak,
      hasDueInText,
      reportDueAt: meta.reportDueAt?.toISOString() ?? null,
      canonicalAppendix,
      issues,
    }
    rows.push(row)
    if (issues.length > 0) failures.push(row)
  }

  const summary = {
    total: rows.length,
    footerLeak: rows.filter((r) => r.footerLeak).length,
    zeroItems: rows.filter((r) => r.issues.includes("zero_items")).length,
    missingDue: rows.filter((r) => r.issues.includes("missing_report_due_at")).length,
    failed: failures.length,
  }

  const report = { generatedAt: new Date().toISOString(), summary, rows, failures }
  writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ outPath, summary }, null, 2))

  if (failures.length > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
