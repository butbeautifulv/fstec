import { notFound } from "next/navigation"
import { ScopedDashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { PublicBreadcrumbMiddle } from "@/components/public/public-breadcrumb-effect"
import { buildDashboardPageProps } from "@/lib/dashboard/build-dashboard-page-props"
import { serializePublicStatuses } from "@/lib/public/serialize-public"
import { validateOrgAccessLinkSubdivision } from "@/lib/public/validate-token"
import { getWorkflowStatuses } from "@/lib/statuses"

type Params = { params: Promise<{ token: string; subId: string }> }

export default async function PublicSubdivisionPage({
  params,
  searchParams,
}: {
  params: Params["params"]
  searchParams: Promise<{ overdue?: string }>
}) {
  const { token, subId } = await params
  const subdivisionId = Number(subId)
  if (!Number.isFinite(subdivisionId)) notFound()

  const { overdue: overdueParam } = await searchParams
  const overdueOnly = overdueParam === "1"

  const [ctx, statuses] = await Promise.all([
    validateOrgAccessLinkSubdivision(token, subdivisionId),
    getWorkflowStatuses(),
  ])
  if (!ctx) notFound()

  const organizationId = ctx.organization.id

  return (
    <ScopedDashboardPageShell
      {...buildDashboardPageProps({
        variant: "public",
        scope: { type: "subdivision", organizationId, subdivisionId },
        token,
        statuses: serializePublicStatuses(statuses),
        title: ctx.subdivision.name,
        description: `Подразделение · ${ctx.organization.name}`,
        overdueOnly,
        emptyMessage: "Нет мер для отображения.",
        breadcrumbEffect: (
          <PublicBreadcrumbMiddle
            crumbs={[
              { label: "Сводка", href: `/p/${token}` },
              {
                label: ctx.subdivision.name,
                href: `/p/${token}/subdivisions/${subdivisionId}`,
              },
            ]}
          />
        ),
      })}
    />
  )
}
