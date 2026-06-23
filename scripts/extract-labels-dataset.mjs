#!/usr/bin/env node
/**
 * Offline: extract measure→subdivision labels from Отчет*.xlsx in corpus folders.
 * Usage: node scripts/extract-labels-dataset.mjs [--out labels-dataset.jsonl]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CORPUS = join(ROOT, ".external/240 93 6837")

async function readXlsxRowsZip(filePath) {
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
  if (!sheetPath) return []
  const sheetXml = await zip.file(sheetPath).async("string")
  const rows = []
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g
  const cellRe = /<c([^>]*)>(?:<v>([^<]*)<\/v>)?/g
  for (const rowMatch of sheetXml.matchAll(rowRe)) {
    const cells = []
    for (const cellMatch of rowMatch[1].matchAll(cellRe)) {
      const attrs = cellMatch[1]
      let val = cellMatch[2] ?? ""
      if (/t="s"/.test(attrs) && val) val = shared[Number(val)] ?? val
      cells.push(val)
    }
    if (cells.some((c) => String(c).trim())) rows.push(cells)
  }
  return rows
}

function docNumberFromFolder(name) {
  const m = name.match(/240\s*93\s*(\d+)/)
  return m ? `240/93/${m[1]}` : null
}

async function main() {
  const outArg = process.argv.indexOf("--out")
  const outPath =
    outArg >= 0 ? process.argv[outArg + 1] : join(ROOT, "labels-dataset.jsonl")

  const lines = []
  let fileCount = 0

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

    const documentNumber = docNumberFromFolder(dirName)
    if (!documentNumber) continue

    for (const f of files) {
      if (!/^Отчет/i.test(f) || !f.endsWith(".xlsx")) continue
      try {
        const rows = await readXlsxRowsZip(join(dir, f))
        fileCount++
        for (const row of rows.slice(2)) {
          if (!row[0] || !String(row[0]).trim().match(/^\d+$/)) continue
          const subdivision = (row[3] ?? "").trim().split("\n")[0]
          const measureText = (row[1] ?? "").trim()
          const result = (row[6] ?? "").trim().split("\n")[0]
          if (!subdivision || !measureText) continue
          if (subdivision.startsWith("Указать")) continue
          lines.push(
            JSON.stringify({
              documentNumber,
              reportFile: f,
              rowNumber: row[0],
              measureTextSnippet: measureText.slice(0, 500),
              subdivisionName: subdivision,
              result: result || null,
            })
          )
        }
      } catch {
        // skip broken xlsx
      }
    }
  }

  writeFileSync(outPath, lines.join("\n") + (lines.length ? "\n" : ""))
  console.log(JSON.stringify({ labelRows: lines.length, reportFiles: fileCount, outPath }))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
