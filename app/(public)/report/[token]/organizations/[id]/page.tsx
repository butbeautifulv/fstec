import { notFound } from "next/navigation"
import { ReportOrdersListClient } from "@/components/report/report-page-clients"
import { getOrganizationOrdersForReportToken } from "@/lib/report-links/validate-token"

type Params = { params: Promise<{ token: string; id: string }> }

export default async function ReportOrganizationOrdersPage({ params }: Params) {
  const { token, id } = await params
  const organizationId = Number(id)
  if (!Number.isFinite(organizationId)) notFound()

  const ctx = await getOrganizationOrdersForReportToken(token, organizationId)
  if (!ctx) notFound()

  const orders = ctx.orders.map((order) => ({
    id: order.id,
    title: order.title,
    issuedAt: order.issuedAt.toISOString(),
    itemCount: order._count.items,
  }))

  return (
    <ReportOrdersListClient
      token={token}
      organizationName={ctx.organization.name}
      orders={JSON.parse(JSON.stringify(orders))}
    />
  )
}
