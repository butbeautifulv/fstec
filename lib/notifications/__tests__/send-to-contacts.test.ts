import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 1, status: "SENT" }),
}))

import { sendEmail } from "@/lib/email/send"
import { sendToContacts } from "@/lib/notifications/send-to-contacts"

const mockedSendEmail = vi.mocked(sendEmail)

describe("sendToContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends email to each contact with dedupe key", async () => {
    const contacts = [
      { email: "a@test.com" },
      { email: "b@test.com" },
    ]

    await sendToContacts(
      contacts,
      (contact) => ({
        subject: `Hello ${contact.email}`,
        text: "text",
        html: "<p>html</p>",
      }),
      {
        template: "test-template",
        relatedType: "order",
        relatedId: 42,
        dedupeKey: (contact) => `test:${contact.email}`,
      }
    )

    expect(mockedSendEmail).toHaveBeenCalledTimes(2)
    expect(mockedSendEmail).toHaveBeenCalledWith({
      to: "a@test.com",
      subject: "Hello a@test.com",
      text: "text",
      html: "<p>html</p>",
      template: "test-template",
      relatedType: "order",
      relatedId: 42,
      dedupeKey: "test:a@test.com",
    })
    expect(mockedSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "b@test.com", dedupeKey: "test:b@test.com" })
    )
  })

  it("handles empty contact list", async () => {
    await sendToContacts(
      [],
      () => ({ subject: "x", text: "x", html: "x" }),
      {
        template: "t",
        relatedType: "order",
        relatedId: 1,
        dedupeKey: () => "k",
      }
    )
    expect(mockedSendEmail).not.toHaveBeenCalled()
  })
})
