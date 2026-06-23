import {
  detectImportKind,
  isRecommendationsAppendix,
  parseMeasureItemsFromParagraphs,
} from "@/lib/measure-imports/parse-docx"
import {
  appendixMeasureName,
  composeMeasureItemName,
  type extractMetadata,
} from "@/lib/measure-imports/extract-metadata"
import { tagMeasure } from "@/lib/measure-imports/tag-measure"

export function buildParsedItems(input: {
  paragraphs: string[]
  originalName: string
  parentImportId: number | null
  metadata: ReturnType<typeof extractMetadata>
}) {
  const recommendations =
    input.parentImportId != null ||
    isRecommendationsAppendix(input.paragraphs, input.originalName)

  if (recommendations) {
    return parseMeasureItemsFromParagraphs(input.paragraphs).map((item) => ({
      ...item,
      name: composeMeasureItemName({
        documentNumber: input.metadata.documentNumber,
        title: input.metadata.title,
        code: item.code,
        sortOrder: item.sortOrder,
      }),
      tags: tagMeasure(item.description, item.code),
    }))
  }

  const rawItems = parseMeasureItemsFromParagraphs(input.paragraphs)
  const kind = detectImportKind(input.paragraphs, input.originalName)

  if (kind === "APPENDIX" && rawItems.length === 0) {
    return [
      {
        code: input.metadata.documentNumber ?? "appendix",
        name: appendixMeasureName(input.metadata.documentNumber),
        description: `Исходный файл: ${input.originalName}`,
        sortOrder: 0,
        tags: ["ioc"] as string[],
      },
    ]
  }

  return rawItems.map((item) => ({
    ...item,
    name: composeMeasureItemName({
      documentNumber: input.metadata.documentNumber,
      title: input.metadata.title,
      code: item.code,
      sortOrder: item.sortOrder,
    }),
    tags: tagMeasure(item.description, item.code),
  }))
}
