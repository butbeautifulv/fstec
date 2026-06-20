import { notFound } from "next/navigation"
import { PlatformShell } from "@/components/platform/platform-shell"
import { buildPlatformSessionUser } from "@/lib/auth/platform-session"
import { requirePageSession } from "@/lib/auth/page-guard"
import { countPendingDelayRequests } from "@/lib/delays"
import { countPendingResponses } from "@/lib/responses"
import { getUserById } from "@/lib/users"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requirePageSession()
  const [user, pendingDelays, pendingResponses] = await Promise.all([
    getUserById(session.userId),
    countPendingDelayRequests(),
    countPendingResponses(),
  ])

  if (!user) notFound()

  return (
    <PlatformShell
      initialUser={buildPlatformSessionUser(user)}
      pendingDelays={pendingDelays}
      pendingResponses={pendingResponses}
    >
      {children}
    </PlatformShell>
  )
}
