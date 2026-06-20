import dynamic from "next/dynamic"
import { notFound } from "next/navigation"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { getDelayRequest } from "@/lib/delays"
import { serializeDelayDetail } from "@/lib/serialize/panel"

const DelayRequestDetailClient = dynamic(
  () =>
    import("@/components/platform/delay-request-detail-client").then(
      (mod) => mod.DelayRequestDetailClient
    ),
  { loading: () => <TablePageSkeleton columns={6} /> }
)

type Params = { params: Promise<{ id: string }> }

export default async function DelayRequestDetailPage({ params }: Params) {
  const id = Number((await params).id)
  if (!Number.isFinite(id)) notFound()

  const delay = await getDelayRequest(id)
  if (!delay) notFound()

  return <DelayRequestDetailClient delay={serializeDelayDetail(delay)} />
}
