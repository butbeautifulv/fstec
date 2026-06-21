import { redirect } from "next/navigation"

export default async function OrderBatchCreateRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ importId?: string; preset?: string }>
}) {
  const { importId, preset } = await searchParams
  const params = new URLSearchParams()
  if (importId) params.set("importId", importId)
  if (preset) params.set("preset", preset)
  const query = params.toString()
  redirect(query ? `/panel/orders/new?${query}` : "/panel/orders/new")
}
