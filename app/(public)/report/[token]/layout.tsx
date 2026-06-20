import { notFound } from "next/navigation"
import { ReportShell } from "@/components/report/report-shell"
import { validateReportToken } from "@/lib/report-links/validate-token"

type Params = { params: Promise<{ token: string }> }

export default async function ReportTokenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params["params"]
}) {
  const { token } = await params
  const ctx = await validateReportToken(token)
  if (!ctx) notFound()

  return <ReportShell>{children}</ReportShell>
}
