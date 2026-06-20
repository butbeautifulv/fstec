import { Suspense } from "react"
import dynamic from "next/dynamic"
import { notFound } from "next/navigation"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { getOrder } from "@/lib/orders"
import { serializeOrderDetail } from "@/lib/serialize/panel"

const OrderDetailClient = dynamic(
  () =>
    import("@/components/platform/order-detail-client").then(
      (mod) => mod.OrderDetailClient
    ),
  { loading: () => <TablePageSkeleton columns={8} /> }
)

async function OrderDetailSection({ id }: { id: number }) {
  const order = await getOrder(id)
  if (!order) notFound()

  return <OrderDetailClient order={serializeOrderDetail(order)} />
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = Number((await params).id)

  return (
    <Suspense fallback={<TablePageSkeleton columns={8} />}>
      <OrderDetailSection id={id} />
    </Suspense>
  )
}
