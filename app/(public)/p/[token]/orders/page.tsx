import { notFound } from "next/navigation"
import { PublicOrdersListPage } from "@/components/public/public-orders-list-page"
import { validateAccessToken } from "@/lib/public/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function PublicOrdersPage({ params }: Params) {
  const { token } = await params
  const ctx = await validateAccessToken(token)
  if (!ctx) notFound()

  const orders = ctx.orders
    .filter((order) => order.items.length > 0)
    .map((order) => ({
      id: order.id,
      title: order.title,
      issuedAt: order.issuedAt.toISOString(),
      itemCount: order.items.length,
    }))

  return (
    <PublicOrdersListPage
      token={token}
      orders={JSON.parse(JSON.stringify(orders))}
    />
  )
}
