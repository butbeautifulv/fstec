import { notFound } from "next/navigation"
import { ScopedOrdersListClient } from "@/components/shared/scoped-orders-clients"
import { serializePublicOrderSummary } from "@/lib/public/serialize-public"
import { fetchPublicOrderSummaries } from "@/lib/public/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function PublicOrdersPage({ params }: Params) {
  const { token } = await params
  const ctx = await fetchPublicOrderSummaries(token)
  if (!ctx) notFound()

  const orders = ctx.orders.map(serializePublicOrderSummary)

  return <ScopedOrdersListClient context={{ scope: "public", token }} orders={orders} />
}
