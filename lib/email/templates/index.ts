import { format } from "date-fns"
import { ru } from "date-fns/locale"

export function orderAssignedTemplate(input: {
  organizationName: string
  orderTitle: string
  dueAt: Date | null
  measureCount: number
  portalUrl: string
}) {
  const dueText = input.dueAt
    ? format(input.dueAt, "dd MMMM yyyy, HH:mm", { locale: ru })
    : "не указан"

  const text = [
    `Новое поручение для ${input.organizationName}`,
    "",
    `Название: ${input.orderTitle}`,
    `Срок исполнения: ${dueText}`,
    `Количество мер: ${input.measureCount}`,
    "",
    `Перейти к исполнению: ${input.portalUrl}`,
  ].join("\n")

  const html = `
    <p>Новое поручение для <strong>${escapeHtml(input.organizationName)}</strong>.</p>
    <p><strong>${escapeHtml(input.orderTitle)}</strong></p>
    <ul>
      <li>Срок исполнения: ${escapeHtml(dueText)}</li>
      <li>Количество мер: ${input.measureCount}</li>
    </ul>
    <p><a href="${escapeAttr(input.portalUrl)}">Открыть личный кабинет исполнителя</a></p>
  `

  return {
    subject: `Новое поручение: ${input.orderTitle}`,
    text,
    html,
  }
}

export function responseSubmittedTemplate(input: {
  organizationName: string
  measureName: string
  orderTitle: string
  reviewUrl: string
}) {
  const text = [
    "Поступил новый отчёт на проверку",
    "",
    `Организация: ${input.organizationName}`,
    `Поручение: ${input.orderTitle}`,
    `Мера: ${input.measureName}`,
    "",
    `Открыть: ${input.reviewUrl}`,
  ].join("\n")

  const html = `
    <p>Поступил новый отчёт на проверку.</p>
    <ul>
      <li>Организация: ${escapeHtml(input.organizationName)}</li>
      <li>Поручение: ${escapeHtml(input.orderTitle)}</li>
      <li>Мера: ${escapeHtml(input.measureName)}</li>
    </ul>
    <p><a href="${escapeAttr(input.reviewUrl)}">Открыть отчёт</a></p>
  `

  return {
    subject: `Новый отчёт: ${input.measureName}`,
    text,
    html,
  }
}

export function responseReviewedTemplate(input: {
  organizationName: string
  measureName: string
  orderTitle: string
  accepted: boolean
  reviewNote?: string | null
  portalUrl: string
}) {
  const status = input.accepted ? "принят" : "возвращён на доработку"
  const text = [
    `Отчёт ${status}`,
    "",
    `Организация: ${input.organizationName}`,
    `Поручение: ${input.orderTitle}`,
    `Мера: ${input.measureName}`,
    ...(input.reviewNote ? ["", `Комментарий: ${input.reviewNote}`] : []),
    "",
    `Портал: ${input.portalUrl}`,
  ].join("\n")

  const html = `
    <p>Отчёт по мере <strong>${escapeHtml(input.measureName)}</strong> ${status}.</p>
    <ul>
      <li>Организация: ${escapeHtml(input.organizationName)}</li>
      <li>Поручение: ${escapeHtml(input.orderTitle)}</li>
    </ul>
    ${
      input.reviewNote
        ? `<p><strong>Комментарий:</strong> ${escapeHtml(input.reviewNote)}</p>`
        : ""
    }
    <p><a href="${escapeAttr(input.portalUrl)}">Открыть портал исполнителя</a></p>
  `

  return {
    subject: `Отчёт ${status}: ${input.measureName}`,
    text,
    html,
  }
}

export function dueReminderTemplate(input: {
  organizationName: string
  measureName: string
  orderTitle: string
  dueAt: Date
  overdue: boolean
  portalUrl: string
}) {
  const dueText = format(input.dueAt, "dd MMMM yyyy, HH:mm", { locale: ru })
  const headline = input.overdue
    ? "Просрочено исполнение меры"
    : "Приближается срок исполнения меры"

  const text = [
    headline,
    "",
    `Организация: ${input.organizationName}`,
    `Поручение: ${input.orderTitle}`,
    `Мера: ${input.measureName}`,
    `Срок: ${dueText}`,
    "",
    `Портал: ${input.portalUrl}`,
  ].join("\n")

  const html = `
    <p><strong>${headline}</strong></p>
    <ul>
      <li>Организация: ${escapeHtml(input.organizationName)}</li>
      <li>Поручение: ${escapeHtml(input.orderTitle)}</li>
      <li>Мера: ${escapeHtml(input.measureName)}</li>
      <li>Срок: ${escapeHtml(dueText)}</li>
    </ul>
    <p><a href="${escapeAttr(input.portalUrl)}">Открыть портал исполнителя</a></p>
  `

  return {
    subject: `${headline}: ${input.measureName}`,
    text,
    html,
  }
}

export function importFromInboxTemplate(input: {
  documentNumber: string | null
  originalName: string
  measureCount: number
  importUrl: string
}) {
  const label = input.documentNumber ?? input.originalName
  const text = [
    "Из почтового ящика загружен новый документ",
    "",
    `Документ: ${label}`,
    `Мер в preview: ${input.measureCount}`,
    "",
    `Открыть: ${input.importUrl}`,
  ].join("\n")

  const html = `
    <p>Из почтового ящика загружен новый документ <strong>${escapeHtml(label)}</strong>.</p>
    <p>Мер в preview: ${input.measureCount}</p>
    <p><a href="${escapeAttr(input.importUrl)}">Открыть импорт</a></p>
  `

  return {
    subject: `Новый документ из почты: ${label}`,
    text,
    html,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;")
}
