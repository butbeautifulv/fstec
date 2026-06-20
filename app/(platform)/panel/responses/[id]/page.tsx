import dynamic from "next/dynamic"
import { notFound } from "next/navigation"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { getResponse } from "@/lib/responses"
import { serializeResponseDetail } from "@/lib/serialize/panel"

const ResponseDetailClient = dynamic(
  () =>
    import("@/components/platform/response-detail-client").then(
      (mod) => mod.ResponseDetailClient
    ),
  { loading: () => <TablePageSkeleton columns={6} /> }
)

type Params = { params: Promise<{ id: string }> }

export default async function ResponseDetailPage({ params }: Params) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const response = await getResponse(id)
  if (!response) notFound()

  return <ResponseDetailClient response={serializeResponseDetail(response)} />
}
