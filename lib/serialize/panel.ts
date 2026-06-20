import type { UserRole } from "@prisma/client"
import type { OrderDetail } from "@/components/platform/order-detail-client"
import type { DelayRequestTableRow } from "@/components/platform/delay-requests-table"
import type { DelayRequestDetail } from "@/components/platform/delay-request-detail-client"
import type { ResponseTableRow } from "@/components/platform/responses-table"
import type { ResponseDetail } from "@/components/platform/response-detail-client"

type WithDates = Record<string, unknown>

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  return typeof value === "string" ? value : value.toISOString()
}

function mapValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(mapValue)
  if (value && typeof value === "object") return mapObject(value as WithDates)
  return value
}

function mapObject<T extends WithDates>(obj: T): T {
  const out: WithDates = {}
  for (const [key, value] of Object.entries(obj)) {
    out[key] = mapValue(value)
  }
  return out as T
}

export function serializeForClient<T>(value: T): T {
  return mapValue(value) as T
}

export function serializeOrders(
  orders: {
    id: number
    title: string
    issuedAt: Date | string
    defaultDueAt: Date | string | null
    organization: { id: number; name: string }
    createdBy: { id: number; name: string }
    _count: { items: number }
  }[]
) {
  return orders.map((order) => ({
    id: order.id,
    title: order.title,
    issuedAt: toIso(order.issuedAt)!,
    defaultDueAt: toIso(order.defaultDueAt),
    organization: order.organization,
    createdBy: order.createdBy,
    _count: order._count,
  }))
}

export function serializeStatuses(
  statuses: { id: number; name: string; isTerminal: boolean; sortOrder?: number }[]
) {
  return statuses.map((status) => ({
    id: status.id,
    name: status.name,
    isTerminal: status.isTerminal,
    ...(status.sortOrder !== undefined ? { sortOrder: status.sortOrder } : {}),
  }))
}

export function serializeMeasures(
  measures: {
    id: number
    name: string
    code: string | null
    description: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }[]
) {
  return measures.map((measure) => ({
    id: measure.id,
    name: measure.name,
    code: measure.code,
    description: measure.description,
    createdAt: toIso(measure.createdAt)!,
    updatedAt: toIso(measure.updatedAt)!,
  }))
}

export function serializeUsers(
  users: {
    id: number
    email: string
    name: string
    role: UserRole
    createdAt: Date
  }[]
) {
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }))
}

export function serializeAccessLinks(
  links: {
    id: number
    token: string
    expiresAt: Date | null
    revokedAt: Date | null
    createdAt: Date
    subdivisionId: number | null
    subdivision: { id: number; name: string } | null
  }[]
) {
  return links.map((link) => ({
    id: link.id,
    token: link.token,
    expiresAt: toIso(link.expiresAt),
    revokedAt: toIso(link.revokedAt),
    createdAt: link.createdAt.toISOString(),
    subdivisionId: link.subdivisionId,
    subdivision: link.subdivision,
  }))
}

export function serializeOrderDetail(order: object): OrderDetail {
  return serializeForClient(order) as OrderDetail
}

export function serializeOrderForEdit(order: { id: number; title: string }) {
  return { id: order.id, title: order.title }
}

export function serializeOrderItemEditContext(item: {
  id: number
  dueAt: Date
  status: { id: number; name: string; isTerminal: boolean }
  subdivision: { id: number; name: string } | null
  measure: { id: number; name: string }
  order: {
    id: number
    title: string
    organization: { subdivisions: { id: number; name: string }[] }
  }
}) {
  return serializeForClient({
    orderId: item.order.id,
    orderTitle: item.order.title,
    item: {
      id: item.id,
      dueAt: item.dueAt.toISOString(),
      status: item.status,
      subdivision: item.subdivision,
      measure: item.measure,
    },
    subdivisions: item.order.organization.subdivisions,
  })
}

export function serializeOrderItemResponseContext(item: {
  id: number
  measure: { id: number; name: string }
  order: { id: number; title: string }
}) {
  return serializeForClient({
    orderId: item.order.id,
    orderTitle: item.order.title,
    item: {
      id: item.id,
      measure: item.measure,
    },
  })
}

export function serializeOrderItemDelaysContext(item: {
  id: number
  measure: { id: number; name: string }
  order: { id: number; title: string }
  delayRequests: {
    id: number
    status: string
    requestedDueAt: Date
    justification: string | null
    createdAt: Date
  }[]
}) {
  return serializeForClient({
    orderId: item.order.id,
    orderTitle: item.order.title,
    measureName: item.measure.name,
    delayRequests: item.delayRequests.map((delay) => ({
      id: delay.id,
      status: delay.status,
      requestedDueAt: delay.requestedDueAt.toISOString(),
      justification: delay.justification,
      createdAt: delay.createdAt.toISOString(),
    })),
  })
}

export function serializeResponseDetail(response: ResponseDetail | object): ResponseDetail {
  return serializeForClient(response) as ResponseDetail
}

export function serializeDelayDetail(delay: DelayRequestDetail | object): DelayRequestDetail {
  return serializeForClient(delay) as DelayRequestDetail
}

export function serializeResponseRows(rows: object[]): ResponseTableRow[] {
  return rows.map((row) => serializeForClient(row) as ResponseTableRow)
}

export function serializeDelayRows(rows: object[]): DelayRequestTableRow[] {
  return rows.map((row) => serializeForClient(row) as DelayRequestTableRow)
}
