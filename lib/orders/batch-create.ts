import { prisma } from "@/lib/db"
import { getDefaultStatusId } from "@/lib/statuses"
import type { BatchCreateOrdersInput } from "@/lib/validations/orders"
import { buildOrderItemsCreate } from "@/lib/orders/build-order-items"
import { BatchCreateValidationError } from "@/lib/orders/batch-create-errors"
import { validateBatchTargets } from "@/lib/orders/validate-batch-targets"

export { BatchCreateValidationError } from "@/lib/orders/batch-create-errors"

export async function batchCreateOrders(
  input: BatchCreateOrdersInput,
  createdById: number
) {
  const defaultStatusId = await getDefaultStatusId()
  const dueAt = input.defaultDueAt
  const targets = await validateBatchTargets(
    prisma,
    input.targets.map((target) => ({
      organizationId: target.organizationId,
      subdivisionId: target.subdivisionId ?? null,
    })),
    input.measureIds
  )

  if (input.sourceImportId != null) {
    const importRecord = await prisma.measureImport.findUnique({
      where: { id: input.sourceImportId },
      select: { status: true },
    })
    if (!importRecord || importRecord.status !== "IMPORTED") {
      throw new BatchCreateValidationError("IMPORT_INVALID_STATUS")
    }
  }

  return prisma.$transaction(async (tx) => {
    const orders = []

    for (const target of targets) {
      const order = await tx.order.create({
        data: {
          title: input.title,
          organizationId: target.organizationId,
          createdById,
          sourceImportId: input.sourceImportId ?? null,
          defaultDueAt: dueAt,
          items: {
            create: buildOrderItemsCreate({
              measureIds: input.measureIds,
              dueAt,
              statusId: defaultStatusId,
              subdivisionId: target.subdivisionId ?? null,
            }),
          },
        },
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      })
      orders.push(order)
    }

    return orders
  })
}
