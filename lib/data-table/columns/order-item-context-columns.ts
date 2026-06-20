import type { ColumnDef } from "@tanstack/react-table"
import { createMeasureColumn } from "@/lib/data-table/columns/measure-column"
import { createOrderColumn } from "@/lib/data-table/columns/order-column"
import { createOrganizationColumn } from "@/lib/data-table/columns/organization-column"

export type OrderItemContext = {
  organization: { id: number; name: string }
  order: { id: number; title: string }
  measure: { id: number; name: string }
}

export function createOrderItemContextColumns<TRow>(
  getContext: (row: TRow) => OrderItemContext,
  basePath = "/panel"
): ColumnDef<TRow>[] {
  return [
    createOrganizationColumn(
      (row) => getContext(row).organization,
      (org) => `${basePath}/organizations/${org.id}`
    ),
    createOrderColumn(
      (row) => getContext(row).order,
      (order) => `${basePath}/orders/${order.id}`
    ),
    createMeasureColumn(
      (row) => getContext(row).measure,
      (measure) => `${basePath}/measures/${measure.id}/edit`
    ),
  ]
}

export function orderItemContextSearchFields(
  context: OrderItemContext,
  extra: string[] = []
): string[] {
  return [
    context.organization.name,
    context.order.title,
    context.measure.name,
    ...extra,
  ]
}
