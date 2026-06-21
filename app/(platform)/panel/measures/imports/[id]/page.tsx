import { notFound } from "next/navigation"
import { MeasureImportDetailClient } from "@/components/platform/measure-import-detail-client"
import { getMeasureImport } from "@/lib/measure-imports"
import { serializeMeasureImportDetail } from "@/lib/serialize/panel"

export default async function MeasureImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const importId = Number(id)
  if (Number.isNaN(importId)) notFound()

  const record = await getMeasureImport(importId)
  if (!record) notFound()

  return (
    <MeasureImportDetailClient initialImport={serializeMeasureImportDetail(record)} />
  )
}
