#!/usr/bin/env node
/**
 * Build prisma/seed-manifest.generated.json from corpus audit scan.
 * Usage: npx tsx scripts/build-seed-manifest.mjs
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CORPUS = join(ROOT, ".external/240 93 6837")
const OUT = join(ROOT, "prisma/seed-manifest.generated.json")

const LETTER_FILE_RE = /^240 93 \d+\.docx$/i
const SKIP_NAME_RE = /прилож|ответ|отчет|ответствен/i
const MUST_HAVE = new Set(["240/93/6837", "240/93/4164", "240/93/1409"])

function folderToDocNumber(folder) {
  const m = folder.match(/240 93 (\d+)/)
  return m ? `240/93/${m[1]}` : null
}

async function loadCanonicalAppendix() {
  const { pickCanonicalAppendixFile } = await import(
    join(ROOT, "lib/measure-imports/canonical-appendix.ts")
  )
  return pickCanonicalAppendixFile
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
  if (!existsSync(CORPUS)) {
    console.error("Corpus not found:", CORPUS)
    process.exit(1)
  }

  const {
    extractDocxParagraphsAsync,
    parseMeasureItemsFromParagraphs,
    detectImportKind,
  } = await import(join(ROOT, "lib/measure-imports/parse-docx.ts"))
  const pickCanonicalAppendixFile = await loadCanonicalAppendix()

  const letters = []
  const routingPairs = []

  for (const folder of readdirSync(CORPUS)) {
    const dir = join(CORPUS, folder)
    let files
    try {
      files = readdirSync(dir)
    } catch {
      continue
    }

    const letterFile = files.find((f) => LETTER_FILE_RE.test(f) && !SKIP_NAME_RE.test(f))
    if (!letterFile) continue

    const documentNumber = folderToDocNumber(folder)
    if (!documentNumber) continue

    const appendixFile = pickCanonicalAppendixFile(files, folder)
    const hasAppendixFile = appendixFile != null

    let measureCount = 0
    let pattern = "error"
    let kind = "LETTER"
    try {
      const buffer = readFileSync(join(dir, letterFile))
      const paragraphs = await extractDocxParagraphsAsync(buffer)
      const items = parseMeasureItemsFromParagraphs(paragraphs)
      measureCount = items.length
      kind = detectImportKind(paragraphs, letterFile)
      pattern = classifyPattern(items, paragraphs, hasAppendixFile)
    } catch (error) {
      letters.push({
        folder,
        documentNumber,
        letterFile,
        pattern: "error",
        error: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    const tier = MUST_HAVE.has(documentNumber)
      ? "must-have"
      : pattern === "routing"
        ? "routing"
        : measureCount > 0
          ? "with-measures"
          : "skip"

    const letterEntry = {
      folder,
      documentNumber,
      letterFile,
      appendixFile,
      hasAppendixFile,
      measureCount,
      pattern,
      kind,
      tier,
      seedByDefault:
        tier === "must-have" || tier === "routing" || documentNumber === "240/93/1409",
    }

    letters.push(letterEntry)

    if (pattern === "routing") {
      routingPairs.push({
        folder,
        documentNumber,
        letterFile,
        appendixFile,
        hasAppendixFile,
        seedByDefault: true,
      })
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    corpusPath: CORPUS,
    letters,
    routingPairs,
    defaultImportCount: letters.filter((l) => l.seedByDefault).length,
    withMeasuresCount: letters.filter((l) => (l.measureCount ?? 0) > 0).length,
    totalLetters: letters.length,
  }

  writeFileSync(OUT, JSON.stringify(manifest, null, 2))
  console.log(
    JSON.stringify(
      {
        outPath: OUT,
        totalLetters: manifest.totalLetters,
        defaultImportCount: manifest.defaultImportCount,
        withMeasuresCount: manifest.withMeasuresCount,
        routingPairs: routingPairs.length,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
