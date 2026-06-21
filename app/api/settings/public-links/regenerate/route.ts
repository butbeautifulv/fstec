import { z } from "zod"
import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import { revalidatePanelDashboard } from "@/lib/api/revalidate-panel"
import { revalidatePath } from "next/cache"
import {
  regenerateAllActivePublicLinkScopes,
  regeneratePublicLinkScopes,
} from "@/lib/public-links/regenerate-scopes"
import { listPublicLinkScopes } from "@/lib/public-links/list-scopes"

const bodySchema = z.object({
  keys: z.array(z.string().min(1)).optional(),
  allActive: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    await requirePermission(Permission.settingsWrite)
    const body = bodySchema.parse(await request.json())

    let regenerated
    if (body.allActive) {
      const scopes = await listPublicLinkScopes()
      regenerated = await regenerateAllActivePublicLinkScopes(scopes)
    } else if (body.keys?.length) {
      regenerated = await regeneratePublicLinkScopes(body.keys)
    } else {
      return handleApiError(new Error("keys or allActive required"))
    }

    await revalidatePanelDashboard()
    revalidatePath("/panel/organizations")

    return jsonOk({ regenerated })
  } catch (error) {
    return handleApiError(error)
  }
}
