import { notFound } from "next/navigation"
import { DelayRequestDetailClient } from "@/components/platform/delay-request-detail-client"
import { getDelayRequest } from "@/lib/delays"

type Params = { params: Promise<{ id: string }> }

export default async function DelayRequestDetailPage({ params }: Params) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const delay = await getDelayRequest(id)
  if (!delay) notFound()

  return (
    <DelayRequestDetailClient delay={JSON.parse(JSON.stringify(delay))} />
  )
}
