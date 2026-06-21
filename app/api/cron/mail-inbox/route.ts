import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertCronSecret } from "@/lib/cron/auth"
import { fetchInboxDocxImports } from "@/lib/mail-inbox/fetch"

export async function POST(request: Request) {
  try {
    assertCronSecret(request)
    const result = await fetchInboxDocxImports()
    return jsonOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
