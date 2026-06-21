import type { MeasureImportKind, MeasureImportStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { regulatoryDocStorageKey } from "@/lib/regulatory-docs/config"
import { uploadRegulatoryDocBuffer } from "@/lib/regulatory-docs/storage"
import {
  detectImportKind,
  extractDocxParagraphsAsync,
  parseMeasureItemsFromParagraphs,
} from "@/lib/measure-imports/parse-docx"
import {
  extractMetadata,
  appendixMeasureName,
  composeMeasureItemName,
} from "@/lib/measure-imports/extract-metadata"
import { getCommittedMeasureIds } from "@/lib/measure-imports/commit"

export function listMeasureImports() {
  return prisma.measureImport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      parentImport: { select: { id: true, documentNumber: true, originalName: true } },
      _count: { select: { items: true, measures: true, orders: true, appendices: true } },
    },
  })
}

export function getMeasureImport(id: number) {
  return prisma.measureImport.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      parentImport: { select: { id: true, documentNumber: true, originalName: true } },
      appendices: {
        select: { id: true, originalName: true, documentNumber: true, status: true },
      },
      items: { orderBy: { sortOrder: "asc" } },
      measures: { select: { id: true, name: true, code: true } },
      _count: { select: { orders: true, measures: true } },
    },
  })
}

export async function createMeasureImportUpload(input: {
  buffer: Buffer
  originalName: string
  mimeType: string
  uploadedById: number
  parentImportId?: number | null
  uploadedVia?: "MANUAL" | "EMAIL"
}) {
  const kind: MeasureImportKind = input.parentImportId ? "APPENDIX" : "LETTER"

  const record = await prisma.measureImport.create({
    data: {
      kind,
      status: "UPLOADED",
      originalName: input.originalName.slice(0, 255),
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      storageKey: "pending",
      uploadedById: input.uploadedById,
      parentImportId: input.parentImportId ?? null,
      uploadedVia: input.uploadedVia ?? "MANUAL",
    },
  })

  const storageKey = regulatoryDocStorageKey(record.id, input.originalName)
  const { sha256 } = await uploadRegulatoryDocBuffer(
    storageKey,
    input.buffer,
    input.mimeType
  )

  return prisma.measureImport.update({
    where: { id: record.id },
    data: { storageKey, sha256 },
  })
}

export async function parseMeasureImport(id: number) {
  const record = await getMeasureImport(id)
  if (!record) throw new Error("NOT_FOUND")

  try {
    const { downloadRegulatoryDocBuffer } = await import("@/lib/regulatory-docs/storage")
    const buffer = await downloadRegulatoryDocBuffer(record.storageKey)
    const paragraphs = await extractDocxParagraphsAsync(buffer)
    const metadata = extractMetadata(paragraphs, record.originalName)
    const kind =
      record.parentImportId != null
        ? "APPENDIX"
        : detectImportKind(paragraphs, record.originalName)

    const parsedItems =
      kind === "APPENDIX"
        ? [
            {
              code: metadata.documentNumber ?? "appendix",
              name: appendixMeasureName(metadata.documentNumber),
              description: `Исходный файл: ${record.originalName}`,
              sortOrder: 0,
            },
          ]
        : parseMeasureItemsFromParagraphs(paragraphs).map((item) => ({
            ...item,
            name: composeMeasureItemName({
              documentNumber: metadata.documentNumber,
              title: metadata.title,
              code: item.code,
              sortOrder: item.sortOrder,
            }),
          }))

    await prisma.$transaction(async (tx) => {
      await tx.measureImportItem.deleteMany({ where: { importId: id } })
      if (parsedItems.length > 0) {
        await tx.measureImportItem.createMany({
          data: parsedItems.map((item) => ({
            importId: id,
            code: item.code,
            name: item.name,
            description: item.description,
            sortOrder: item.sortOrder,
            included: true,
          })),
        })
      }
      await tx.measureImport.update({
        where: { id },
        data: {
          kind,
          status: parsedItems.length > 0 ? "PARSED" : "FAILED",
          documentNumber: metadata.documentNumber,
          title: metadata.title,
          reportDueAt: metadata.reportDueAt,
          parseError: parsedItems.length > 0 ? null : "NO_ITEMS_FOUND",
        },
      })
    })

    return getMeasureImport(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "PARSE_FAILED"
    await prisma.measureImport.update({
      where: { id },
      data: { status: "FAILED", parseError: message },
    })
    throw error
  }
}

export async function updateMeasureImportItems(
  importId: number,
  items: Array<{
    id: number
    name?: string
    code?: string | null
    description?: string | null
    included?: boolean
  }>
) {
  const record = await prisma.measureImport.findUnique({ where: { id: importId } })
  if (!record) throw new Error("NOT_FOUND")
  if (record.status !== "PARSED" && record.status !== "IMPORTED") {
    throw new Error("IMPORT_INVALID_STATUS")
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.measureImportItem.update({
        where: { id: item.id, importId },
        data: {
          ...(item.name != null ? { name: item.name } : {}),
          ...(item.code !== undefined ? { code: item.code } : {}),
          ...(item.description !== undefined ? { description: item.description } : {}),
          ...(item.included !== undefined ? { included: item.included } : {}),
        },
      })
    )
  )

  return getMeasureImport(importId)
}

export async function addManualImportItem(importId: number) {
  const record = await prisma.measureImport.findUnique({
    where: { id: importId },
    include: { _count: { select: { items: true } } },
  })
  if (!record) throw new Error("NOT_FOUND")

  const maxSort = await prisma.measureImportItem.aggregate({
    where: { importId },
    _max: { sortOrder: true },
  })

  return prisma.measureImportItem.create({
    data: {
      importId,
      name: "Новая мера",
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      included: true,
    },
  })
}

export async function getImportMeasureIds(importId: number) {
  const ids = await getCommittedMeasureIds(importId)
  return ids.map((measureId) => ({ measureId }))
}

export async function deleteMeasureImport(id: number) {
  const record = await prisma.measureImport.findUnique({
    where: { id },
    include: { appendices: { select: { id: true } } },
  })
  if (!record) throw new Error("NOT_FOUND")

  await prisma.$transaction(async (tx) => {
    for (const appendix of record.appendices) {
      await tx.measureImport.delete({ where: { id: appendix.id } })
    }
    await tx.measureImport.delete({ where: { id } })
  })
}

export type MeasureImportListItem = Awaited<ReturnType<typeof listMeasureImports>>[number]

export type MeasureImportDetail = NonNullable<Awaited<ReturnType<typeof getMeasureImport>>>

export type MeasureImportStatusType = MeasureImportStatus
