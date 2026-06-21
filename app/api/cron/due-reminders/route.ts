import { cronRoute } from "@/lib/api/route-handler"
import { sendDueReminders } from "@/lib/notifications/due-reminders"

export const POST = cronRoute(() => sendDueReminders())
