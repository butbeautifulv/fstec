import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

const mockConnect = vi.hoisted(() => vi.fn())
const mockLogout = vi.hoisted(() => vi.fn())
const mockGetMailboxLock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ release: vi.fn() })
)
const mockMessageFlagsAdd = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDownload = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    content: (async function* () {
      yield Buffer.from("docx-content")
    })(),
  })
)

const mockFetch = vi.hoisted(() =>
  vi.fn(async function* () {
    yield {
      uid: 42,
      bodyStructure: {
        disposition: "attachment",
        part: "2",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dispositionParameters: { filename: "measure.docx" },
      },
    }
  })
)

vi.mock("imapflow", () => ({
  ImapFlow: vi.fn(() => ({
    connect: mockConnect,
    logout: mockLogout,
    getMailboxLock: mockGetMailboxLock,
    messageFlagsAdd: mockMessageFlagsAdd,
    download: mockDownload,
    fetch: mockFetch,
  })),
}))
vi.mock("@/lib/measure-imports", () => ({
  createMeasureImportUpload: vi.fn().mockResolvedValue({ id: 99 }),
  parseMeasureImport: vi.fn().mockResolvedValue({
    documentNumber: "240-93-4164",
    items: [{ id: 1 }, { id: 2 }],
  }),
}))
vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 1 }),
}))
vi.mock("@/lib/email/config", () => ({
  getAppBaseUrl: vi.fn(() => "http://localhost:3000"),
  getOperatorNotifyEmail: vi.fn(() => "operator@fstec.local"),
}))

import { sendEmail } from "@/lib/email/send"
import { createMeasureImportUpload, parseMeasureImport } from "@/lib/measure-imports"
import { fetchInboxDocxImports, isImapConfigured } from "@/lib/mail-inbox/fetch"

describe("isImapConfigured", () => {
  it("returns false without env", () => {
    expect(isImapConfigured()).toBe(false)
  })

  it("returns true when env complete", () => {
    vi.stubEnv("INBOX_IMAP_HOST", "imap.test")
    vi.stubEnv("INBOX_IMAP_USER", "user")
    vi.stubEnv("INBOX_IMAP_PASS", "pass")
    expect(isImapConfigured()).toBe(true)
  })
})

describe("fetchInboxDocxImports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("INBOX_IMAP_HOST", "imap.test")
    vi.stubEnv("INBOX_IMAP_USER", "user")
    vi.stubEnv("INBOX_IMAP_PASS", "pass")
    mockPrisma.user.findFirst.mockResolvedValue({ id: 1 })
    mockGetMailboxLock.mockResolvedValue({ release: vi.fn() })
    mockDownload.mockResolvedValue({
      content: (async function* () {
        yield Buffer.from("docx-content")
      })(),
    })
    vi.mocked(createMeasureImportUpload).mockResolvedValue({ id: 99 } as never)
    vi.mocked(parseMeasureImport).mockResolvedValue({
      documentNumber: "240-93-4164",
      items: [{ id: 1 }, { id: 2 }],
    } as never)
  })

  it("skips when imap not configured", async () => {
    vi.unstubAllEnvs()
    const result = await fetchInboxDocxImports()
    expect(result).toEqual({ processed: 0, skipped: true })
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it("processes docx attachments from unseen messages", async () => {
    const result = await fetchInboxDocxImports()

    expect(result).toEqual({ processed: 1, skipped: false })
    expect(mockConnect).toHaveBeenCalled()
    expect(createMeasureImportUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: "measure.docx",
        uploadedVia: "EMAIL",
        uploadedById: 1,
      })
    )
    expect(parseMeasureImport).toHaveBeenCalledWith(99)
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "import-from-inbox",
        relatedType: "measure_import",
        relatedId: 99,
      })
    )
    expect(mockMessageFlagsAdd).toHaveBeenCalledWith({ uid: 42 }, ["\\Seen"])
    expect(mockLogout).toHaveBeenCalled()
  })

  it("collects docx from nested bodyStructure using parameters.name", async () => {
    mockFetch.mockImplementationOnce(async function* () {
      yield {
        uid: 55,
        bodyStructure: {
          childNodes: [
            {
              disposition: "attachment",
              part: "3",
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              parameters: { name: "nested.docx" },
            },
          ],
        },
      } as never
    })

    const result = await fetchInboxDocxImports()
    expect(result.processed).toBe(1)
    expect(createMeasureImportUpload).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "nested.docx" })
    )
  })

  it("handles parsed import without document number", async () => {
    vi.mocked(parseMeasureImport).mockResolvedValueOnce({
      documentNumber: null,
      items: [],
    } as never)

    await fetchInboxDocxImports()

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.any(String),
      })
    )
  })

  it("throws when no super admin uploader", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)
    await expect(fetchInboxDocxImports()).rejects.toThrow("NOT_FOUND")
  })

  it("marks message seen when no docx attachments", async () => {
    mockFetch.mockImplementationOnce(async function* () {
      yield {
        uid: 7,
        bodyStructure: {
          childNodes: [
            {
              disposition: "attachment",
              part: "2",
              type: "application/pdf",
              dispositionParameters: { filename: "report.pdf" },
            },
          ],
        },
      } as never
    })

    const result = await fetchInboxDocxImports()
    expect(result).toEqual({ processed: 0, skipped: false })
    expect(createMeasureImportUpload).not.toHaveBeenCalled()
    expect(mockMessageFlagsAdd).toHaveBeenCalledWith({ uid: 7 }, ["\\Seen"])
  })

  it("handles buffer content directly without async iteration", async () => {
    mockDownload.mockResolvedValueOnce({
      content: Buffer.from("direct-buffer"),
    })

    await fetchInboxDocxImports()

    expect(createMeasureImportUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: Buffer.from("direct-buffer"),
      })
    )
  })
})
