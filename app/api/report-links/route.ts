import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { revalidatePanelDashboard } from "@/lib/api/revalidate-panel"
import type { DashboardScope } from "@/lib/dashboard/stats"
import {
  createReportLink,
  getActiveReportLink,
  listReportLinks,
  revokeReportLink,
} from "@/lib/report-links"
import { z } from "zod"

const dashboardScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("global") }),
  z.object({
    type: z.literal("organization"),
    organizationId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("subdivision"),
    organizationId: z.number().int().positive(),
    subdivisionId: z.number().int().positive(),
  }),
]) satisfies z.ZodType<DashboardScope>

const createReportLinkSchema = z.object({
  scope: dashboardScopeSchema.optional(),
})

export async function GET() {
  try {
    await requirePermission(Permission.settingsWrite)
    const [active, links] = await Promise.all([
      getActiveReportLink(),
      listReportLinks(),
    ])
    return jsonOk({ active, links })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(Permission.settingsWrite)
    let scope: DashboardScope = { type: "global" }

    const contentType = request.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const parsed = await parseJsonBody(request, createReportLinkSchema)
      if ("error" in parsed) return parsed.error
      if (parsed.data.scope) scope = parsed.data.scope
    }

    const link = await createReportLink(scope)
    await revalidatePanelDashboard()
    return jsonOk(link, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission(Permission.settingsWrite)
    const linkId = Number(new URL(request.url).searchParams.get("linkId"))
    if (!linkId) return handleApiError(new Error("linkId required"))
    await revokeReportLink(linkId)
    await revalidatePanelDashboard()
    return jsonOk({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
