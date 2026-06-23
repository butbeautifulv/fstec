#!/usr/bin/env node
/**
 * Copy a small DOCX slice from full corpus into ignored .external/docx_examples/corpus/
 * Usage: node scripts/prepare-corpus-slice.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const FULL_CORPUS = join(ROOT, ".external/240 93 6837")
const SLICE = join(ROOT, ".external/docx_examples/corpus")

const DOC_NUMBERS = ["6837", "4164", "1409"]
const LETTER_FILE_RE = /^240 93 \d+\.docx$/i
const SKIP_NAME_RE = /ответ|отчет|ответствен/i

function copyFromFolder(folderPath, destDir) {
  let copied = 0
  let files
  try {
    files = readdirSync(folderPath)
  } catch {
    return 0
  }

  for (const file of files) {
    if (!file.endsWith(".docx") || SKIP_NAME_RE.test(file)) continue
    const isLetter = LETTER_FILE_RE.test(file)
    const isAppendix = /приложение/i.test(file)
    if (!isLetter && !isAppendix) continue

    const dest = join(destDir, file)
    copyFileSync(join(folderPath, file), dest)
    console.log("  →", file)
    copied++
  }
  return copied
}

function main() {
  if (!existsSync(FULL_CORPUS)) {
    console.error("Full corpus not found:", FULL_CORPUS)
    console.error("Place archive under .external/240 93 6837/ first.")
    process.exit(1)
  }

  mkdirSync(SLICE, { recursive: true })
  let total = 0

  for (const num of DOC_NUMBERS) {
    const folderName = `240 93 ${num}`
    const folder = join(FULL_CORPUS, folderName)
    if (!existsSync(folder)) {
      console.warn("skip (missing):", folderName)
      continue
    }
    console.log(folderName + ":")
    total += copyFromFolder(folder, SLICE)
  }

  console.log(`\nDone: ${total} file(s) in ${SLICE}`)
}

main()
