import { notFound } from "next/navigation"
import { PublicOrdersListPage } from "@/components/public/public-orders-list-page"
import { serializePublicOrderSummary } from "@/lib/public/serialize-public"
import { fetchPublicOrderSummaries } from "@/lib/public/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function PublicOrdersPage({ params }: Params) {
  const { token } = await params
  const ctx = await fetchPublicOrderSummaries(token)
  if (!ctx) notFound()

  const orders = ctx.orders.map(serializePublicOrderSummary)

  return <PublicOrdersListPage token={token} orders={orders} />
}
