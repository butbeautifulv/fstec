import { describe, expect, it } from "vitest"
import {
  dueReminderTemplate,
  importFromInboxTemplate,
  orderAssignedTemplate,
  responseReviewedTemplate,
  responseSubmittedTemplate,
} from "@/lib/email/templates"

describe("orderAssignedTemplate", () => {
  it("builds subject and body with due date", () => {
    const result = orderAssignedTemplate({
      organizationName: "Org & Co",
      orderTitle: "Order <1>",
      dueAt: new Date("2026-07-15T14:30:00"),
      measureCount: 5,
      portalUrl: "http://localhost/p/token",
    })

    expect(result.subject).toBe("Новое поручение: Order <1>")
    expect(result.text).toContain("Org & Co")
    expect(result.text).toContain("Количество мер: 5")
    expect(result.html).toContain("Org &amp; Co")
    expect(result.html).toContain('href="http://localhost/p/token"')
  })

  it("handles null due date", () => {
    const result = orderAssignedTemplate({
      organizationName: "Org",
      orderTitle: "Order",
      dueAt: null,
      measureCount: 1,
      portalUrl: "http://localhost/p/token",
    })
    expect(result.text).toContain("не указан")
  })
})

describe("responseSubmittedTemplate", () => {
  it("includes measure and review url", () => {
    const result = responseSubmittedTemplate({
      organizationName: "Org",
      measureName: "Measure",
      orderTitle: "Order",
      reviewUrl: "http://localhost/panel/responses/1",
    })
    expect(result.subject).toBe("Новый отчёт: Measure")
    expect(result.text).toContain("http://localhost/panel/responses/1")
  })
})

describe("responseReviewedTemplate", () => {
  it("shows accepted status", () => {
    const result = responseReviewedTemplate({
      organizationName: "Org",
      measureName: "M",
      orderTitle: "O",
      accepted: true,
      reviewNote: null,
      portalUrl: "http://localhost/p/token",
    })
    expect(result.subject).toContain("принят")
    expect(result.text).not.toContain("Комментарий:")
  })

  it("shows rejected status with note", () => {
    const result = responseReviewedTemplate({
      organizationName: "Org",
      measureName: "M",
      orderTitle: "O",
      accepted: false,
      reviewNote: 'Fix "issues"',
      portalUrl: "http://localhost/p/token",
    })
    expect(result.subject).toContain("возвращён")
    expect(result.text).toContain('Fix "issues"')
    expect(result.html).toContain("Fix &quot;issues&quot;")
  })
})

describe("dueReminderTemplate", () => {
  it("builds overdue headline", () => {
    const result = dueReminderTemplate({
      organizationName: "Org",
      measureName: "M",
      orderTitle: "O",
      dueAt: new Date("2026-06-01T10:00:00"),
      overdue: true,
      portalUrl: "http://localhost/p/token",
    })
    expect(result.subject).toContain("Просрочено")
  })

  it("builds due-soon headline", () => {
    const result = dueReminderTemplate({
      organizationName: "Org",
      measureName: "M",
      orderTitle: "O",
      dueAt: new Date("2026-06-25T10:00:00"),
      overdue: false,
      portalUrl: "http://localhost/p/token",
    })
    expect(result.subject).toContain("Приближается")
  })
})

describe("importFromInboxTemplate", () => {
  it("uses document number when present", () => {
    const result = importFromInboxTemplate({
      documentNumber: "240-93-4164",
      originalName: "file.docx",
      measureCount: 12,
      importUrl: "http://localhost/panel/measures/imports/1",
    })
    expect(result.subject).toContain("240-93-4164")
  })

  it("falls back to original name", () => {
    const result = importFromInboxTemplate({
      documentNumber: null,
      originalName: "file.docx",
      measureCount: 0,
      importUrl: "http://localhost/panel/measures/imports/1",
    })
    expect(result.subject).toContain("file.docx")
  })
})
