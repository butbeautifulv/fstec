import { Suspense, type ReactNode } from "react"
import { TableOnlySkeleton } from "@/components/shared/skeletons/table-only-skeleton"

async function OrderItemScopedTableInner<T>({
  listFn,
  serializer,
  renderTable,
}: {
  listFn: () => Promise<T[]>
  serializer: (rows: T[]) => unknown[]
  renderTable: (rows: unknown[]) => ReactNode
}) {
  const rows = await listFn()
  return renderTable(serializer(rows))
}

export function OrderItemScopedTableSuspense<T>({
  listFn,
  serializer,
  renderTable,
}: {
  listFn: () => Promise<T[]>
  serializer: (rows: T[]) => unknown[]
  renderTable: (rows: unknown[]) => ReactNode
}) {
  return (
    <Suspense fallback={<TableOnlySkeleton />}>
      <OrderItemScopedTableInner
        listFn={listFn}
        serializer={serializer}
        renderTable={renderTable}
      />
    </Suspense>
  )
}
