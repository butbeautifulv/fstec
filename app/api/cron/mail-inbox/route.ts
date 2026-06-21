import { cronRoute } from "@/lib/api/route-handler"
import { fetchInboxDocxImports } from "@/lib/mail-inbox/fetch"

export const POST = cronRoute(() => fetchInboxDocxImports())
