import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as ReturnType<typeof createMockPrisma> | null }))
const uploadRegulatoryDocBuffer = vi.hoisted(() => vi.fn())
const downloadRegulatoryDocBuffer = vi.hoisted(() => vi.fn())
const getCommittedMeasureIds = vi.hoisted(() => vi.fn())
const extractDocxParagraphsAsync = vi.hoisted(() => vi.fn())
const detectImportKind = vi.hoisted(() => vi.fn())
const parseMeasureItemsFromParagraphs = vi.hoisted(() => vi.fn())
const extractMetadata = vi.hoisted(() => vi.fn())
const appendixMeasureName = vi.hoisted(() => vi.fn())
const composeMeasureItemName = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ get prisma() { return mocks.prisma! } }))
vi.mock("@/lib/regulatory-docs/storage", () => ({
  uploadRegulatoryDocBuffer,
  downloadRegulatoryDocBuffer,
}))
vi.mock("@/lib/measure-imports/commit", () => ({ getCommittedMeasureIds }))
vi.mock("@/lib/measure-imports/parse-docx", () => ({
  extractDocxParagraphsAsync,
  detectImportKind,
  parseMeasureItemsFromParagraphs,
}))
vi.mock("@/lib/measure-imports/extract-metadata", () => ({
  extractMetadata,
  appendixMeasureName,
  composeMeasureItemName,
}))

import {
  addManualImportItem,
  createMeasureImportUpload,
  deleteMeasureImport,
  getImportMeasureIds,
  getMeasureImport,
  listMeasureImports,
  parseMeasureImport,
  updateMeasureImportItems,
} from "@/lib/measure-imports/index"

const mockPrisma = createMockPrisma()
mocks.prisma = mockPrisma

describe("measure-imports index", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadRegulatoryDocBuffer.mockResolvedValue({ sha256: "abc123" })
    downloadRegulatoryDocBuffer.mockResolvedValue(Buffer.from("docx"))
    extractDocxParagraphsAsync.mockResolvedValue(["p1"])
    extractMetadata.mockReturnValue({
      documentNumber: "123",
      title: "Title",
      reportDueAt: new Date("2026-12-31"),
    })
    detectImportKind.mockReturnValue("LETTER")
    parseMeasureItemsFromParagraphs.mockReturnValue([
      { code: "1.1", name: "Item", description: "Desc", sortOrder: 0 },
    ])
    composeMeasureItemName.mockReturnValue("Composed Item")
    appendixMeasureName.mockReturnValue("Appendix Name")
    mockPrisma.$transaction.mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") return cb(mockPrisma)
      return Promise.all(cb as Promise<unknown>[])
    })
  })

  it("listMeasureImports queries prisma", async () => {
    mockPrisma.measureImport.findMany.mockResolvedValue([{ id: 1 }])
    await expect(listMeasureImports()).resolves.toHaveLength(1)
  })

  it("getMeasureImport loads by id", async () => {
    mockPrisma.measureImport.findUnique.mockResolvedValue({ id: 2 })
    await expect(getMeasureImport(2)).resolves.toEqual({ id: 2 })
  })

  describe("createMeasureImportUpload", () => {
    it("creates record and uploads to storage", async () => {
      mockPrisma.measureImport.create.mockResolvedValue({ id: 5 })
      mockPrisma.measureImport.update.mockResolvedValue({
        id: 5,
        storageKey: "key",
        sha256: "abc123",
      })

      const result = await createMeasureImportUpload({
        buffer: Buffer.from("file"),
        originalName: "letter.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedById: 1,
      })

      expect(uploadRegulatoryDocBuffer).toHaveBeenCalled()
      expect(result.sha256).toBe("abc123")
    })

    it("truncates originalName to 255 characters", async () => {
      mockPrisma.measureImport.create.mockResolvedValue({ id: 7 })
      mockPrisma.measureImport.update.mockResolvedValue({ id: 7 })

      await createMeasureImportUpload({
        buffer: Buffer.from("file"),
        originalName: "x".repeat(300),
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedById: 1,
      })

      expect(mockPrisma.measureImport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ originalName: "x".repeat(255) }),
        })
      )
    })

    it("sets uploadedVia EMAIL when provided", async () => {
      mockPrisma.measureImport.create.mockResolvedValue({ id: 8 })
      mockPrisma.measureImport.update.mockResolvedValue({ id: 8 })

      await createMeasureImportUpload({
        buffer: Buffer.from("file"),
        originalName: "letter.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedById: 1,
        uploadedVia: "EMAIL",
      })

      expect(mockPrisma.measureImport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ uploadedVia: "EMAIL" }),
        })
      )
    })

    it("sets APPENDIX kind for child import", async () => {
      mockPrisma.measureImport.create.mockImplementation(async (args: { data: unknown }) => ({
        id: 6,
        ...(args.data as object),
      }))
      mockPrisma.measureImport.update.mockResolvedValue({ id: 6 })

      await createMeasureImportUpload({
        buffer: Buffer.from("file"),
        originalName: "appendix.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedById: 1,
        parentImportId: 3,
      })

      expect(mockPrisma.measureImport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kind: "APPENDIX", parentImportId: 3 }),
        })
      )
    })
  })

  describe("parseMeasureImport", () => {
    it("throws NOT_FOUND when import missing", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue(null)
      await expect(parseMeasureImport(1)).rejects.toThrow("NOT_FOUND")
    })

    it("marks import FAILED on parse error", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue({
        id: 1,
        storageKey: "key",
        originalName: "bad.docx",
        parentImportId: null,
      })
      downloadRegulatoryDocBuffer.mockRejectedValue(new Error("DOWNLOAD_FAILED"))

      await expect(parseMeasureImport(1)).rejects.toThrow("DOWNLOAD_FAILED")
      expect(mockPrisma.measureImport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED", parseError: "DOWNLOAD_FAILED" }),
        })
      )
    })

    it("marks import FAILED with PARSE_FAILED for non-Error rejection", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue({
        id: 1,
        storageKey: "key",
        originalName: "bad.docx",
        parentImportId: null,
      })
      downloadRegulatoryDocBuffer.mockRejectedValue("network down")

      await expect(parseMeasureImport(1)).rejects.toBe("network down")
      expect(mockPrisma.measureImport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED", parseError: "PARSE_FAILED" }),
        })
      )
    })

    it("parses LETTER import successfully", async () => {
      const parsed = { id: 1, status: "PARSED", items: [{ id: 10 }] }
      mockPrisma.measureImport.findUnique
        .mockResolvedValueOnce({
          id: 1,
          storageKey: "key",
          originalName: "letter.docx",
          parentImportId: null,
        })
        .mockResolvedValueOnce(parsed)

      const result = await parseMeasureImport(1)
      expect(result).toEqual(parsed)
      expect(mockPrisma.measureImportItem.createMany).toHaveBeenCalled()
      expect(mockPrisma.measureImport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PARSED", parseError: null }),
        })
      )
    })

    it("parses APPENDIX import with single item", async () => {
      mockPrisma.measureImport.findUnique
        .mockResolvedValueOnce({
          id: 2,
          storageKey: "key",
          originalName: "appendix.docx",
          parentImportId: 5,
        })
        .mockResolvedValueOnce({ id: 2, status: "PARSED" })

      await parseMeasureImport(2)
      expect(appendixMeasureName).toHaveBeenCalled()
      expect(mockPrisma.measureImportItem.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ code: "123", included: true }),
          ]),
        })
      )
    })

    it("marks import FAILED when no items found", async () => {
      parseMeasureItemsFromParagraphs.mockReturnValue([])
      mockPrisma.measureImport.findUnique
        .mockResolvedValueOnce({
          id: 3,
          storageKey: "key",
          originalName: "empty.docx",
          parentImportId: null,
        })
        .mockResolvedValueOnce({ id: 3, status: "FAILED" })

      await parseMeasureImport(3)
      expect(mockPrisma.measureImport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "FAILED",
            parseError: "NO_ITEMS_FOUND",
          }),
        })
      )
      expect(mockPrisma.measureImportItem.createMany).not.toHaveBeenCalled()
    })
  })

  describe("updateMeasureImportItems", () => {
    it("throws NOT_FOUND when import missing", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue(null)
      await expect(updateMeasureImportItems(1, [{ id: 1 }])).rejects.toThrow("NOT_FOUND")
    })

    it("throws IMPORT_INVALID_STATUS for non-editable import", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue({ id: 1, status: "UPLOADED" })
      await expect(updateMeasureImportItems(1, [{ id: 1 }])).rejects.toThrow(
        "IMPORT_INVALID_STATUS"
      )
    })

    it("updates items in transaction", async () => {
      mockPrisma.measureImport.findUnique
        .mockResolvedValueOnce({ id: 1, status: "PARSED" })
        .mockResolvedValueOnce({ id: 1, status: "PARSED", items: [] })

      await updateMeasureImportItems(1, [{ id: 10, name: "Updated" }])
      expect(mockPrisma.measureImportItem.update).toHaveBeenCalled()
    })

    it("updates optional code, description, and included fields", async () => {
      mockPrisma.measureImport.findUnique
        .mockResolvedValueOnce({ id: 1, status: "PARSED" })
        .mockResolvedValueOnce({ id: 1, status: "PARSED", items: [] })

      await updateMeasureImportItems(1, [
        {
          id: 10,
          code: "C-1",
          description: "Notes",
          included: false,
        },
      ])

      expect(mockPrisma.measureImportItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: "C-1",
            description: "Notes",
            included: false,
          }),
        })
      )
    })
  })

  describe("addManualImportItem", () => {
    it("throws NOT_FOUND when import missing", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue(null)
      await expect(addManualImportItem(1)).rejects.toThrow("NOT_FOUND")
    })

    it("creates item with next sort order", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue({
        id: 1,
        _count: { items: 2 },
      })
      mockPrisma.measureImportItem.aggregate.mockResolvedValue({ _max: { sortOrder: 3 } })
      mockPrisma.measureImportItem.create.mockResolvedValue({ id: 11, sortOrder: 4 })

      const item = await addManualImportItem(1)
      expect(item.sortOrder).toBe(4)
    })
  })

  it("getImportMeasureIds maps committed ids", async () => {
    getCommittedMeasureIds.mockResolvedValue([10, 20])
    await expect(getImportMeasureIds(1)).resolves.toEqual([
      { measureId: 10 },
      { measureId: 20 },
    ])
  })

  describe("deleteMeasureImport", () => {
    it("throws NOT_FOUND when import missing", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue(null)
      await expect(deleteMeasureImport(1)).rejects.toThrow("NOT_FOUND")
    })

    it("deletes appendices and parent import", async () => {
      mockPrisma.measureImport.findUnique.mockResolvedValue({
        id: 1,
        appendices: [{ id: 2 }, { id: 3 }],
      })

      await deleteMeasureImport(1)
      expect(mockPrisma.measureImport.delete).toHaveBeenCalledTimes(3)
    })
  })
})
