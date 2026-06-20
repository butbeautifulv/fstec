import { notFound } from "next/navigation"
import { ScopedOrdersListClient } from "@/components/shared/scoped-orders-clients"
import { getOrganizationOrdersForReportToken } from "@/lib/report-links/validate-token"
import { serializeOrderListRows } from "@/lib/public/serialize-public"

type Params = { params: Promise<{ token: string; id: string }> }

export default async function ReportOrganizationOrdersPage({ params }: Params) {
  const { token, id } = await params
  const organizationId = Number(id)
  if (!Number.isFinite(organizationId)) notFound()

  const ctx = await getOrganizationOrdersForReportToken(token, organizationId)
  if (!ctx) notFound()

  return (
    <ScopedOrdersListClient
      context={{
        scope: "report",
        token,
        organizationName: ctx.organization.name,
      }}
      orders={serializeOrderListRows(ctx.orders)}
    />
  )
}
