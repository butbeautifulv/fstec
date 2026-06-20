import { prisma } from "@/lib/db"
import { getDefaultStatusId } from "@/lib/statuses"
import { getScopedDashboardItems } from "@/lib/dashboard/get-scoped-dashboard"
import type { DashboardScope } from "@/lib/dashboard/stats"
import type { CreateOrderInput } from "@/lib/validations/orders"

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { issuedAt: "desc" },
    include: {
      organization: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  })
}

export async function getOrder(id: number) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      organization: { include: { subdivisions: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          measure: true,
          status: true,
          subdivision: true,
          responses: { orderBy: { submittedAt: "desc" }, take: 1 },
          delayRequests: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  })
}

export async function getOrderForEdit(id: number) {
  return prisma.order.findUnique({
    where: { id },
    select: { id: true, title: true },
  })
}

export async function getOrderItemContext(orderId: number, itemId: number) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: {
      measure: { select: { id: true, name: true } },
      status: true,
      subdivision: true,
      order: {
        select: {
          id: true,
          title: true,
          organization: {
            select: {
              subdivisions: { select: { id: true, name: true }, orderBy: { name: "asc" } },
            },
          },
        },
      },
    },
  })
  return item
}

export async function getOrderItemDelayRequests(orderId: number, itemId: number) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: {
      measure: { select: { id: true, name: true } },
      order: { select: { id: true, title: true } },
      delayRequests: { orderBy: { createdAt: "desc" } },
    },
  })
  return item
}

export async function getOrderItemForResponse(orderId: number, itemId: number) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: {
      measure: { select: { id: true, name: true } },
      order: { select: { id: true, title: true } },
    },
  })
  return item
}

export async function createOrder(input: CreateOrderInput, createdById: number) {
  const defaultStatusId = await getDefaultStatusId()

  return prisma.order.create({
    data: {
      title: input.title,
      organizationId: input.organizationId,
      createdById,
      defaultDueAt: input.defaultDueAt ?? null,
      items: {
        create: input.items.map((item) => ({
          measureId: item.measureId,
          dueAt: item.dueAt,
          statusId: item.statusId ?? defaultStatusId,
          subdivisionId: item.subdivisionId ?? null,
        })),
      },
    },
    include: {
      organization: true,
      items: { include: { measure: true, status: true } },
    },
  })
}

export async function updateOrder(id: number, data: { title: string }) {
  return prisma.order.update({
    where: { id },
    data: { title: data.title },
    include: {
      organization: true,
      items: { include: { measure: true, status: true } },
    },
  })
}

export async function deleteOrder(id: number) {
  return prisma.order.delete({ where: { id } })
}

export async function updateOrderItem(
  orderId: number,
  itemId: number,
  data: {
    statusId?: number
    dueAt?: Date
    subdivisionId?: number | null
  }
) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
  })
  if (!item) throw new Error("NOT_FOUND")

  return prisma.orderItem.update({
    where: { id: itemId },
    data: {
      ...(data.statusId !== undefined && { statusId: data.statusId }),
      ...(data.dueAt !== undefined && { dueAt: data.dueAt }),
      ...(data.subdivisionId !== undefined && { subdivisionId: data.subdivisionId }),
    },
    include: {
      measure: true,
      status: true,
      subdivision: true,
    },
  })
}

export async function deleteOrderItem(orderId: number, itemId: number) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
  })
  if (!item) throw new Error("NOT_FOUND")
  return prisma.orderItem.delete({ where: { id: itemId } })
}

export async function getScopedDashboardMatrix(scope: DashboardScope = { type: "global" }) {
  return getScopedDashboardItems(scope, { overdueOnly: false })
}

export async function getDashboardMatrix() {
  return getScopedDashboardMatrix({ type: "global" })
}
