import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  detectImportKind,
  extractDocxParagraphsAsync,
  parseMeasureItemsFromParagraphs,
} from "../parse-docx"
import { extractMetadata, composeMeasureItemName } from "../extract-metadata"

const FIXTURES = join(process.cwd(), ".external/docx_examples")

async function main() {
  const appendixBuffer = readFileSync(join(FIXTURES, "Приложение 240 93 4164.docx"))
  const appendixParagraphs = await extractDocxParagraphsAsync(appendixBuffer)
  assert.equal(detectImportKind(appendixParagraphs, "Приложение 240 93 4164.docx"), "APPENDIX")
  assert.equal(parseMeasureItemsFromParagraphs(appendixParagraphs).length, 0)

  const doc4164Buffer = readFileSync(join(FIXTURES, "240 93 4164.docx"))
  const paragraphs4164 = await extractDocxParagraphsAsync(doc4164Buffer)
  const items4164 = parseMeasureItemsFromParagraphs(paragraphs4164)
  const metadata4164 = extractMetadata(paragraphs4164, "240 93 4164.docx")

  console.log("\n240 93 4164.docx")
  console.log(`  paragraphs: ${paragraphs4164.length}`)
  console.log(`  measures: ${items4164.length}`)
  console.log(`  documentNumber: ${metadata4164.documentNumber}`)

  assert.equal(detectImportKind(paragraphs4164, "240 93 4164.docx"), "LETTER")
  assert.equal(items4164.length, 16)

  const named4164 = items4164.map((item) => ({
    ...item,
    name: composeMeasureItemName({
      documentNumber: metadata4164.documentNumber,
      title: metadata4164.title,
      code: item.code,
      sortOrder: item.sortOrder,
    }),
  }))

  assert.equal(named4164[0]?.name, "240/93/4164 · 1.1")
  assert.ok(named4164[0]?.description.includes("Производить на этапе приема письма"))
  assert.ok(named4164[0]!.description.length > named4164[0]!.name.length)

  const codes4164 = items4164.map((item) => item.code)
  assert.deepEqual(codes4164, [
    "1.1",
    "1.2",
    "1.3",
    "1.4",
    "1.5",
    "1.6",
    "1.7",
    "1.8",
    "1.9",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
  ])

  const item18 = items4164.find((item) => item.code === "1.8")
  assert.ok(item18?.description.includes("192[.]3[.]171[.]223"))
  assert.ok(item18?.description.includes("hxxp[:]//"))

  const item19 = items4164.find((item) => item.code === "1.9")
  assert.ok(item19?.description.match(/ae340c8b69b058f91809b62dbd4bef72dac085d9810f56ae4f50e19afe903912/))
  assert.ok(item19?.description.match(/c00e7b288e3885b1b16f406576b2a85cfe5e006ce6621352d4ef99596486cb65/))

  const item2 = items4164.find((item) => item.code === "2")
  assert.ok(item2?.description.includes("vniir-monitor[.]space"))
  assert.ok(item2?.description.includes("документа-приманки и внедрение"))
  assert.ok(!item2?.description.includes("приманкии"))

  const item4 = items4164.find((item) => item.code === "4")
  assert.ok(item4?.description.includes("инфраструктуры Российской Федерации"))
  assert.ok(item4?.description.includes("файл с расширением"))
  assert.ok(!item4?.description.includes("инфраструктурыРоссийской"))
  assert.ok(!item4?.description.includes("файлс "))
  const hashMatches = item4?.description.match(/[a-f0-9]{64}/gi) ?? []
  assert.ok(hashMatches.length >= 3)

  const item6 = items4164.find((item) => item.code === "6")
  assert.ok(item6?.description.includes("levelgeo"))

  const item8 = items4164.find((item) => item.code === "8")
  assert.ok(item8?.description.includes("1e41c7bfaa6aa3b93b6cc024274a10e33f3e12fe7c98c1db387ef8927f9d1984"))
  assert.ok(!item8?.description.includes("otd93@fstec.ru"))
  assert.ok(!item8?.description.includes("Панкова"))
  assert.ok(!item8?.description.includes("Приложение: Индикаторы"))

  const item12 = items4164.find((item) => item.code === "1.2")
  assert.ok(item12?.description.includes("Kaspersky"))

  const doc4165Buffer = readFileSync(join(FIXTURES, "240 93 4165.docx"))
  const paragraphs4165 = await extractDocxParagraphsAsync(doc4165Buffer)
  const items4165 = parseMeasureItemsFromParagraphs(paragraphs4165)
  const metadata4165 = extractMetadata(paragraphs4165, "240 93 4165.docx")

  console.log("\n240 93 4165.docx")
  console.log(`  paragraphs: ${paragraphs4165.length}`)
  console.log(`  measures: ${items4165.length}`)

  assert.equal(items4165.length, 5)
  assert.ok(items4165.every((item) => item.code?.startsWith("BDU:")))

  const item4165_2 = items4165[1]
  assert.equal(
    composeMeasureItemName({
      documentNumber: metadata4165.documentNumber,
      title: metadata4165.title,
      code: item4165_2?.code ?? null,
      sortOrder: item4165_2?.sortOrder,
    }),
    `240/93/4165 · ${item4165_2?.code}`
  )
  assert.ok(item4165_2?.description.includes("Рекомендуется реализовать"))

  const item4165_3 = items4165[2]
  assert.ok(
    item4165_3?.description.includes("1-3") ||
      item4165_3?.description.includes("1–3")
  )

  const item4165_5 = items4165[4]
  assert.ok(item4165_5?.description.includes("Windows"))
  assert.ok(item4165_5?.description.includes("240/91/3526"))
  assert.ok(!item4165_5?.description.includes("otd93@fstec.ru"))
  assert.ok(!item4165_5?.description.includes("Лукьянова"))

  console.log("\nAll DOCX parser fixture checks passed.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
