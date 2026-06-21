import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mockSendMail = vi.hoisted(() => vi.fn().mockResolvedValue({ messageId: "msg-1" }))
const mockCreateTransport = vi.hoisted(() =>
  vi.fn(() => ({ sendMail: mockSendMail }))
)
const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))
vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}))
vi.mock("@/lib/email/config", () => ({
  isSmtpConfigured: vi.fn(),
  getSmtpConfig: vi.fn(() => ({
    host: "smtp.test",
    port: 587,
    user: "user",
    pass: "pass",
    from: "noreply@test.local",
  })),
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import { isSmtpConfigured } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendMail.mockResolvedValue({ messageId: "msg-1" })
    mockPrisma.emailDelivery.findUnique.mockResolvedValue(null)
    mockPrisma.emailDelivery.create.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: 100,
      ...args.data,
      status: "PENDING",
    }))
    mockPrisma.emailDelivery.update.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: 100,
      status: args.data.status,
      ...args.data,
    }))
  })

  it("skips send when dedupe key already SENT", async () => {
    mockPrisma.emailDelivery.findUnique.mockResolvedValue({
      id: 50,
      status: "SENT",
      dedupeKey: "key-1",
    })

    const result = await sendEmail({
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
      dedupeKey: "key-1",
    })

    expect(result).toEqual({ id: 50, status: "SENT", dedupeKey: "key-1" })
    expect(mockPrisma.emailDelivery.create).not.toHaveBeenCalled()
  })

  it("log-only mode marks delivery SENT without transport", async () => {
    vi.mocked(isSmtpConfigured).mockReturnValue(false)
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})

    const result = await sendEmail({
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
      template: "test",
    })

    expect(infoSpy).toHaveBeenCalledWith("[email:log-only]", expect.any(Object))
    expect(mockSendMail).not.toHaveBeenCalled()
    expect(result.status).toBe("SENT")
    expect(result.error).toBe("log-only")
    infoSpy.mockRestore()
  })

  it("sends via smtp and marks SENT", async () => {
    vi.mocked(isSmtpConfigured).mockReturnValue(true)

    const result = await sendEmail({
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
    })

    expect(mockSendMail).toHaveBeenCalledWith({
      from: "noreply@test.local",
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
    })
    expect(result.status).toBe("SENT")
  })

  it("creates transport without auth when smtp user/pass missing", async () => {
    vi.resetModules()
    vi.doMock("@/lib/db", () => ({
      get prisma() {
        return mocks.prisma!
      },
    }))
    vi.doMock("nodemailer", () => ({
      default: { createTransport: mockCreateTransport },
    }))
    vi.doMock("@/lib/email/config", () => ({
      isSmtpConfigured: vi.fn(() => true),
      getSmtpConfig: vi.fn(() => ({
        host: "smtp.test",
        port: 587,
        user: "",
        pass: "",
        from: "noreply@test.local",
      })),
    }))

    const { sendEmail: sendEmailFresh } = await import("@/lib/email/send")

    await sendEmailFresh({
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
    })

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: undefined,
      })
    )
  })

  it("marks FAILED when transport throws", async () => {
    vi.mocked(isSmtpConfigured).mockReturnValue(true)
    mockSendMail.mockRejectedValueOnce(new Error("SMTP down"))

    const result = await sendEmail({
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
    })

    expect(result.status).toBe("FAILED")
    expect(result.error).toBe("SMTP down")
  })

  it("marks FAILED with generic message for non-Error throws", async () => {
    vi.mocked(isSmtpConfigured).mockReturnValue(true)
    mockSendMail.mockRejectedValueOnce("smtp unavailable")

    const result = await sendEmail({
      to: "a@test.com",
      subject: "Hi",
      text: "text",
      html: "html",
    })

    expect(result.status).toBe("FAILED")
    expect(result.error).toBe("SEND_FAILED")
  })
})
