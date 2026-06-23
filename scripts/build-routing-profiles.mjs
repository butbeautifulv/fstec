#!/usr/bin/env node
/**
 * Build routing tag profiles from labels-dataset.jsonl
 * Usage: node scripts/build-routing-profiles.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const LABELS = join(ROOT, "labels-dataset.jsonl")
const OUT = join(ROOT, "lib/measure-imports/routing-profiles.generated.json")

const TAG_RULES = [
  { tag: "network", re: /сетев|ngfw|чёрн|белым списк|блокировк/i },
  { tag: "siem", re: /мониторинг событий|корреляц|siem/i },
  { tag: "email", re: /почтов|вложен|домен отправител/i },
  { tag: "av", re: /антивирус|kaspersky/i },
  { tag: "vulnerability", re: /bdu:|уязвим|cvss/i },
  { tag: "organizational", re: /утверд|многофактор|ответственн/i },
]

function tagText(text) {
  const tags = []
  for (const { tag, re } of TAG_RULES) {
    if (re.test(text)) tags.push(tag)
  }
  return tags
}

async function readJsonl(path) {
  const rows = []
  if (!existsSync(path)) return rows
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      rows.push(JSON.parse(line))
    } catch {
      // skip
    }
  }
  return rows
}

async function main() {
  const rows = await readJsonl(LABELS)
  const profiles = {}

  for (const row of rows) {
    const sub = row.subdivisionName
    if (!sub || sub === "Не применимо") continue
    if (!profiles[sub]) profiles[sub] = {}
    const tags = tagText(row.measureTextSnippet ?? "")
    if (tags.length === 0) {
      profiles[sub]._untagged = (profiles[sub]._untagged ?? 0) + 1
    }
    for (const tag of tags) {
      profiles[sub][tag] = (profiles[sub][tag] ?? 0) + 1
    }
  }

  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), profiles }, null, 2))
  console.log(`Wrote ${OUT} (${Object.keys(profiles).length} subdivisions, ${rows.length} rows)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
