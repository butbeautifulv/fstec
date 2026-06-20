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
    issuedAt: Date
    defaultDueAt: Date | null
    organization: { id: number; name: string }
    createdBy: { id: number; name: string }
    _count: { items: number }
  }[]
) {
  return orders.map((order) => ({
    id: order.id,
    title: order.title,
    issuedAt: order.issuedAt.toISOString(),
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
    createdAt: Date
    updatedAt: Date
  }[]
) {
  return measures.map((measure) => ({
    id: measure.id,
    name: measure.name,
    code: measure.code,
    description: measure.description,
    createdAt: measure.createdAt.toISOString(),
    updatedAt: measure.updatedAt.toISOString(),
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
