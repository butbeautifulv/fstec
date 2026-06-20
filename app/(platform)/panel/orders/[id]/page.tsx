import { Suspense } from "react"
import dynamic from "next/dynamic"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { getOrder } from "@/lib/orders"
import { listSelectableStatuses } from "@/lib/statuses"
import { serializeOrderDetail, serializeStatuses } from "@/lib/serialize/panel"

const OrderDetailClient = dynamic(
  () =>
    import("@/components/platform/order-detail-client").then(
      (mod) => mod.OrderDetailClient
    ),
  { loading: () => <TablePageSkeleton columns={8} /> }
)

async function OrderDetailSection({ id }: { id: number }) {
  const [order, statuses] = await Promise.all([
    getOrder(id),
    listSelectableStatuses(),
  ])
  if (!order) notFound()

  return (
    <OrderDetailClient
      order={serializeOrderDetail(order)}
      statuses={serializeStatuses(statuses)}
    />
  )
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = Number((await params).id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Поручение" backHref="/panel/orders" backLabel="Поручения" />
      <Suspense fallback={<TablePageSkeleton columns={8} />}>
        <OrderDetailSection id={id} />
      </Suspense>
    </div>
  )
}
