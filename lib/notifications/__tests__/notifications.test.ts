import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrisma, type MockPrisma } from "@/lib/__tests__/helpers/mock-prisma"

const mocks = vi.hoisted(() => ({ prisma: null as MockPrisma | null }))

vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.prisma!
  },
}))
vi.mock("@/lib/notifications/send-to-contacts", () => ({
  sendToContacts: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/access-links", () => ({
  ensurePortalLink: vi.fn().mockResolvedValue({ token: "portal-token" }),
}))
vi.mock("@/lib/contacts", () => ({
  resolveContactsForTarget: vi.fn(),
}))
vi.mock("@/lib/email/config", () => ({
  getAppBaseUrl: vi.fn(() => "http://localhost:3000"),
  getOperatorNotifyEmail: vi.fn(() => "operator@fstec.local"),
}))
vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 1, status: "SENT" }),
}))
vi.mock("@/lib/email/templates", () => ({
  orderAssignedTemplate: vi.fn(() => ({
    subject: "Order assigned",
    text: "text",
    html: "html",
  })),
  responseSubmittedTemplate: vi.fn(() => ({
    subject: "Response submitted",
    text: "text",
    html: "html",
  })),
  responseReviewedTemplate: vi.fn(() => ({
    subject: "Response reviewed",
    text: "text",
    html: "html",
  })),
  dueReminderTemplate: vi.fn(() => ({
    subject: "Due reminder",
    text: "text",
    html: "html",
  })),
}))
vi.mock("@/lib/statuses/workflow", () => ({
  isOrderItemOverdue: vi.fn(),
}))

mocks.prisma = createMockPrisma()
const mockPrisma = mocks.prisma

import { ensurePortalLink } from "@/lib/access-links"
import { resolveContactsForTarget } from "@/lib/contacts"
import { sendEmail } from "@/lib/email/send"
import { orderAssignedTemplate, responseReviewedTemplate } from "@/lib/email/templates"
import { notifyOrderAssigned } from "@/lib/notifications/order-assigned"
import { notifyResponseReviewed } from "@/lib/notifications/response-reviewed"
import { notifyResponseSubmitted } from "@/lib/notifications/response-submitted"
import { sendDueReminders } from "@/lib/notifications/due-reminders"
import { queueNotification } from "@/lib/notifications/queue"
import { sendToContacts } from "@/lib/notifications/send-to-contacts"
import { isOrderItemOverdue } from "@/lib/statuses/workflow"

describe("queueNotification", () => {
  it("runs async fn without throwing", async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    queueNotification(fn)
    await vi.waitFor(() => expect(fn).toHaveBeenCalled())
  })

  it("logs errors from async fn", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const fn = vi.fn().mockRejectedValue(new Error("fail"))
    queueNotification(fn)
    await vi.waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("Notification failed:", expect.any(Error))
    )
    errorSpy.mockRestore()
  })
})

describe("notifyOrderAssigned", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensurePortalLink).mockResolvedValue({ token: "portal-token" } as never)
    vi.mocked(resolveContactsForTarget).mockResolvedValue([])
  })

  it("returns early when order not found", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)
    await notifyOrderAssigned(99)
    expect(sendToContacts).not.toHaveBeenCalled()
  })

  it("returns early when no contacts", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 1,
      title: "Order 1",
      organizationId: 10,
      defaultDueAt: new Date("2026-07-01"),
      organization: { id: 10, name: "Org" },
      items: [{ subdivisionId: 5 }],
      _count: { items: 3 },
    })
    vi.mocked(resolveContactsForTarget).mockResolvedValue([])

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
    await notifyOrderAssigned(1)
    expect(infoSpy).toHaveBeenCalledWith("[notifyOrderAssigned] no contacts", { orderId: 1 })
    expect(sendToContacts).not.toHaveBeenCalled()
    infoSpy.mockRestore()
  })

  it("sends to contacts with portal link", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 1,
      title: "Order 1",
      organizationId: 10,
      defaultDueAt: new Date("2026-07-01"),
      organization: { id: 10, name: "Org" },
      items: [{ subdivisionId: 5 }],
      _count: { items: 3 },
    })
    vi.mocked(resolveContactsForTarget).mockResolvedValue([{ email: "c@test.com" } as never])

    await notifyOrderAssigned(1)

    expect(ensurePortalLink).toHaveBeenCalledWith({
      organizationId: 10,
      subdivisionId: 5,
    })
    expect(orderAssignedTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationName: "Org",
        portalUrl: "http://localhost:3000/p/portal-token",
      })
    )
    expect(sendToContacts).toHaveBeenCalled()
  })

  it("uses null subdivision when order has no items", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 2,
      title: "Order 2",
      organizationId: 10,
      defaultDueAt: new Date("2026-07-01"),
      organization: { id: 10, name: "Org" },
      items: [],
      _count: { items: 0 },
    })
    vi.mocked(resolveContactsForTarget).mockResolvedValue([{ email: "c@test.com" } as never])

    await notifyOrderAssigned(2)

    expect(ensurePortalLink).toHaveBeenCalledWith({
      organizationId: 10,
      subdivisionId: null,
    })
  })
})

describe("notifyResponseSubmitted", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns early when response not found", async () => {
    mockPrisma.response.findUnique.mockResolvedValue(null)
    await notifyResponseSubmitted(1)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("sends email to operator", async () => {
    mockPrisma.response.findUnique.mockResolvedValue({
      id: 7,
      orderItem: {
        measure: { name: "Measure A" },
        order: {
          title: "Order 1",
          organization: { name: "Org" },
        },
      },
    })

    await notifyResponseSubmitted(7)

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "operator@fstec.local",
        template: "response-submitted",
        relatedType: "response",
        relatedId: 7,
        dedupeKey: "response-submitted:7",
      })
    )
  })
})

describe("notifyResponseReviewed", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensurePortalLink).mockResolvedValue({ token: "portal-token" } as never)
    vi.mocked(resolveContactsForTarget).mockResolvedValue([])
  })

  it("returns early when response not found", async () => {
    mockPrisma.response.findUnique.mockResolvedValue(null)
    await notifyResponseReviewed(1)
    expect(sendToContacts).not.toHaveBeenCalled()
  })

  it("returns early when no contacts", async () => {
    mockPrisma.response.findUnique.mockResolvedValue({
      id: 1,
      reviewStatus: "ACCEPTED",
      reviewNote: null,
      orderItem: {
        subdivisionId: 2,
        measure: { name: "M" },
        order: {
          organizationId: 10,
          title: "O",
          organization: { name: "Org" },
        },
      },
    })
    vi.mocked(resolveContactsForTarget).mockResolvedValue([])
    await notifyResponseReviewed(1)
    expect(sendToContacts).not.toHaveBeenCalled()
  })

  it("sends reviewed notification to contacts", async () => {
    mockPrisma.response.findUnique.mockResolvedValue({
      id: 1,
      reviewStatus: "REJECTED",
      reviewNote: "Fix it",
      orderItem: {
        subdivisionId: 2,
        measure: { name: "M" },
        order: {
          organizationId: 10,
          title: "O",
          organization: { name: "Org" },
        },
      },
    })
    vi.mocked(resolveContactsForTarget).mockResolvedValue([{ email: "c@test.com" } as never])

    await notifyResponseReviewed(1)

    expect(responseReviewedTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: false, reviewNote: "Fix it" })
    )
    expect(sendToContacts).toHaveBeenCalled()
  })

  it("uses accepted dedupe key for accepted reviews", async () => {
    mockPrisma.response.findUnique.mockResolvedValue({
      id: 3,
      reviewStatus: "ACCEPTED",
      reviewNote: null,
      orderItem: {
        subdivisionId: 2,
        measure: { name: "M" },
        order: {
          organizationId: 10,
          title: "O",
          organization: { name: "Org" },
        },
      },
    })
    vi.mocked(resolveContactsForTarget).mockResolvedValue([
      { email: "Contact@Test.com" } as never,
    ])

    await notifyResponseReviewed(3)

    expect(responseReviewedTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: true })
    )
    expect(sendToContacts).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Function),
      expect.objectContaining({
        dedupeKey: expect.any(Function),
      })
    )
    const dedupeKey = vi.mocked(sendToContacts).mock.calls[0][2].dedupeKey
    expect(dedupeKey({ email: "Contact@Test.com" } as never)).toBe(
      "response-reviewed:3:accepted:contact@test.com"
    )
  })
})

describe("sendDueReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-21T12:00:00Z"))
    vi.mocked(ensurePortalLink).mockResolvedValue({ token: "portal-token" } as never)
    vi.mocked(resolveContactsForTarget).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("skips items that are neither overdue nor due soon", async () => {
    mockPrisma.orderItem.findMany.mockResolvedValue([
      {
        id: 1,
        subdivisionId: null,
        dueAt: new Date("2026-01-01"),
        measure: { name: "M" },
        status: { isTerminal: false },
        order: {
          title: "O",
          organizationId: 10,
          organization: { name: "Org" },
        },
      },
    ])
    vi.mocked(isOrderItemOverdue).mockReturnValue(false)

    const result = await sendDueReminders()
    expect(result).toEqual({ sent: 0 })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("skips due items when no contacts resolved", async () => {
    mockPrisma.orderItem.findMany.mockResolvedValue([
      {
        id: 2,
        subdivisionId: null,
        dueAt: new Date("2026-06-22T12:00:00Z"),
        measure: { name: "M" },
        status: { isTerminal: false },
        order: {
          title: "O",
          organizationId: 10,
          organization: { name: "Org" },
        },
      },
    ])
    vi.mocked(isOrderItemOverdue).mockReturnValue(false)
    vi.mocked(resolveContactsForTarget).mockResolvedValue([])

    const result = await sendDueReminders()
    expect(result).toEqual({ sent: 0 })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("returns zero sent when no due items found", async () => {
    mockPrisma.orderItem.findMany.mockResolvedValue([])
    const result = await sendDueReminders()
    expect(result).toEqual({ sent: 0 })
  })

  it("sends reminder and skips already sent dedupe", async () => {
    mockPrisma.orderItem.findMany.mockResolvedValue([
      {
        id: 5,
        subdivisionId: 3,
        dueAt: new Date("2026-06-20T12:00:00Z"),
        measure: { name: "M" },
        status: { isTerminal: false },
        order: {
          title: "O",
          organizationId: 10,
          organization: { name: "Org" },
        },
      },
    ])
    vi.mocked(isOrderItemOverdue).mockReturnValue(true)
    vi.mocked(resolveContactsForTarget).mockResolvedValue([
      { email: "sent@test.com" } as never,
      { email: "new@test.com" } as never,
    ])
    mockPrisma.emailDelivery.findUnique.mockImplementation(async (args: { where: { dedupeKey: string } }) => {
      if (args.where.dedupeKey.includes("sent@test.com")) {
        return { status: "SENT" }
      }
      return null
    })

    const result = await sendDueReminders()
    expect(result.sent).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "new@test.com", template: "due-reminder" })
    )
  })

  it("sends due-soon reminder for upcoming items", async () => {
    mockPrisma.orderItem.findMany.mockResolvedValue([
      {
        id: 8,
        subdivisionId: null,
        dueAt: new Date("2026-06-23T12:00:00Z"),
        measure: { name: "M" },
        status: { isTerminal: false },
        order: {
          title: "O",
          organizationId: 10,
          organization: { name: "Org" },
        },
      },
    ])
    vi.mocked(isOrderItemOverdue).mockReturnValue(false)
    vi.mocked(resolveContactsForTarget).mockResolvedValue([
      { email: "due@test.com" } as never,
    ])
    mockPrisma.emailDelivery.findUnique.mockResolvedValue(null)

    const result = await sendDueReminders()
    expect(result.sent).toBe(1)
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "due@test.com",
        dedupeKey: expect.stringContaining("due-soon"),
      })
    )
  })
})
