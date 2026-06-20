import { notFound } from "next/navigation"
import { ResponseDetailClient } from "@/components/platform/response-detail-client"
import { getResponse } from "@/lib/responses"

type Params = { params: Promise<{ id: string }> }

export default async function ResponseDetailPage({ params }: Params) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const response = await getResponse(id)
  if (!response) notFound()

  return (
    <ResponseDetailClient response={JSON.parse(JSON.stringify(response))} />
  )
}
