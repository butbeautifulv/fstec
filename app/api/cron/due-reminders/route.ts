import { handleApiError, jsonOk } from "@/lib/api/errors"
import { assertCronSecret } from "@/lib/cron/auth"
import { sendDueReminders } from "@/lib/notifications/due-reminders"

export async function POST(request: Request) {
  try {
    assertCronSecret(request)
    const result = await sendDueReminders()
    return jsonOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
