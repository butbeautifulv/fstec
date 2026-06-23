#!/usr/bin/env node
/**
 * Parser coverage gaps vs corpus ground truth (xlsx + audit).
 * Usage: npx tsx scripts/corpus-gap-report.mjs [--out corpus-gap-report.json]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CORPUS = join(ROOT, ".external/240 93 6837")

const LETTER_FILE_RE = /^240 93 \d+\.docx$/i
const SKIP_NAME_RE = /прилож|ответ|отчет|ответствен/i

async function readXlsxMeasureRowCount(filePath) {
  const { default: JSZip } = await import("jszip")
  const zip = await JSZip.loadAsync(readFileSync(filePath))
  const shared = []
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string")
  if (sharedXml) {
    const siRe = /<si[^>]*>([\s\S]*?)<\/si>/g
    const tRe = /<t[^>]*>([^<]*)<\/t>/g
    for (const m of sharedXml.matchAll(siRe)) {
      const texts = [...m[1].matchAll(tRe)].map((x) => x[1])
      shared.push(texts.join(""))
    }
  }
  const sheetPath = Object.keys(zip.files).find((n) => /^xl\/worksheets\/sheet/.test(n))
  if (!sheetPath) return null
  const sheetXml = await zip.file(sheetPath).async("string")
  let count = 0
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g
  for (const m of sheetXml.matchAll(rowRe)) {
    const cellRe = /<c[^>]* r="([A-Z]+)(\d+)"[^>]*(?: t="s")?[^>]*>(?:<v>(\d+)<\/v>)?/g
    for (const c of m[1].matchAll(cellRe)) {
      if (c[1] !== "A") continue
      const val = c[0].includes('t="s"') ? shared[Number(c[3])] : c[3]
      if (val && String(val).trim().match(/^\d+$/)) {
        count++
        break
      }
    }
  }
  return count
}

function classifyPattern(items, paragraphs, hasAppendixFile) {
  if (items.length === 0) {
    if (hasAppendixFile || paragraphs.some((p) => /Приложение\s*:/i.test(p))) return "routing"
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
    outArg >= 0 ? process.argv[outArg + 1] : join(ROOT, "corpus-gap-report.json")

  if (!existsSync(CORPUS)) {
    console.error("Corpus not found:", CORPUS)
    process.exit(1)
  }

  const {
    extractDocxParagraphsAsync,
    parseMeasureItemsFromParagraphs,
    detectImportKind,
  } = await import(join(ROOT, "lib/measure-imports/parse-docx.ts"))

  const entries = []
  const routing = []
  const zero = []
  const misKind = []
  const xlsxDiff = []

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

    const hasAppendixFile = files.some(
      (f) => /приложение/i.test(f) && f.endsWith(".docx") && !/ответствен/i.test(f)
    )

    try {
      const buffer = readFileSync(join(dir, letterFile))
      const paragraphs = await extractDocxParagraphsAsync(buffer)
      const items = parseMeasureItemsFromParagraphs(paragraphs)
      const kind = detectImportKind(paragraphs, letterFile)
      const pattern = classifyPattern(items, paragraphs, hasAppendixFile)

      const entry = {
        folder,
        file: letterFile,
        kind,
        measureCount: items.length,
        pattern,
        hasAppendixFile,
      }
      entries.push(entry)

      if (pattern === "routing") routing.push(entry)
      if (pattern === "zero") zero.push(entry)
      if (kind === "APPENDIX" && items.length > 0) {
        misKind.push({ ...entry, risk: "import pipeline may commit 1 IOC item instead of N measures" })
      }

      const xlsxFile = files.find((f) => /^Отчет/i.test(f) && f.endsWith(".xlsx"))
      if (xlsxFile && items.length > 0) {
        const xlsxRows = await readXlsxMeasureRowCount(join(dir, xlsxFile))
        if (xlsxRows != null) {
          const diff = xlsxRows - items.length
          if (Math.abs(diff) > 2) {
            xlsxDiff.push({
              folder,
              xlsxRows,
              parserCount: items.length,
              diff,
              kind: diff > 0 ? "undercount" : "overcount",
            })
          }
        }
      }
    } catch (error) {
      entries.push({
        folder,
        file: letterFile,
        error: error instanceof Error ? error.message : String(error),
        pattern: "error",
      })
    }
  }

  const withMeasures = entries.filter((e) => (e.measureCount ?? 0) > 0).length

  const P0_UNDERCOUNT = new Set(["240 93 2616", "240 93 2993", "240 93 3289"])
  const triage = {
    generatedAt: new Date().toISOString(),
    P0: {
      label: "zero letters + routing without appendix",
      entries: [
        ...zero.map((e) => ({ ...e, issue: "zero" })),
        ...routing.filter((e) => !e.hasAppendixFile).map((e) => ({
          ...e,
          issue: "routing_no_appendix",
        })),
      ],
    },
    P1: {
      label: "misKind detectImportKind=APPENDIX with N>0 (fixed at commit since 52.2)",
      count: misKind.length,
      entries: misKind,
    },
    P2: {
      label: "xlsx undercount |diff|>2",
      entries: xlsxDiff.filter((e) => e.kind === "undercount"),
    },
    P3: {
      label: "xlsx overcount or granularity mismatch (e.g. 6837: 19 parsed vs 7 xlsx rows)",
      entries: xlsxDiff.filter((e) => e.kind === "overcount"),
      policy6837:
        "Composite split (1.1–1.7) yields more measures than aggregated xlsx rows — expected",
    },
    undercountPriority: xlsxDiff.filter(
      (e) => e.kind === "undercount" && P0_UNDERCOUNT.has(e.folder)
    ),
  }

  const report = {
    generatedAt: triage.generatedAt,
    total: entries.length,
    withMeasures,
    routing: { count: routing.length, entries: routing },
    zero: { count: zero.length, entries: zero },
    misKind: { count: misKind.length, entries: misKind },
    xlsxDiff: { count: xlsxDiff.length, entries: xlsxDiff },
    triage,
    summary: {
      lostRoutingLetters:
        "0 measures in letter — import appendix separately or measures are lost",
      lostZero: "parser finds no numbered/unnumbered measures",
      misKindRisk:
        "detectImportKind=APPENDIX but parseMeasureItemsFromParagraphs returns N>0",
    },
  }

  writeFileSync(outPath, JSON.stringify(report, null, 2))

  const triagePath = join(ROOT, "corpus-triage.json")
  writeFileSync(triagePath, JSON.stringify(triage, null, 2))

  console.log(`Corpus coverage: ${withMeasures}/${entries.length} letters with measures`)
  console.log(`Lost: ${routing.length} routing (need appendix), ${zero.length} zero`)
  console.log(`Mis-kind risk: ${misKind.length} letters`)
  console.log(`Xlsx diff >2: ${xlsxDiff.length} folders`)
  console.log(`Triage: P0=${triage.P0.entries.length} P1=${triage.P1.count} P2=${triage.P2.entries.length}`)
  console.log(`Full report: ${outPath}`)
  console.log(`Triage: ${triagePath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
