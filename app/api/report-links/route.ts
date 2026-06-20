import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { revalidatePanelDashboard } from "@/lib/api/revalidate-panel"
import {
  createReportLink,
  getActiveReportLink,
  listReportLinks,
  revokeReportLink,
} from "@/lib/report-links"

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

export async function POST() {
  try {
    await requirePermission(Permission.settingsWrite)
    const link = await createReportLink()
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
