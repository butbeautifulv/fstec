import { notFound } from "next/navigation"
import { MeasureImportDetailClient } from "@/components/platform/measure-import-detail-client"
import { PageHeader } from "@/components/shared/page-header"
import { getMeasureImport } from "@/lib/measure-imports"

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={record.documentNumber ?? record.originalName}
        description="Preview и импорт мер из документа"
        backHref="/panel/measures/imports"
        backLabel="Письма"
      />
      <MeasureImportDetailClient
        initialImport={{
          id: record.id,
          kind: record.kind,
          status: record.status,
          documentNumber: record.documentNumber,
          title: record.title,
          reportDueAt: record.reportDueAt?.toISOString() ?? null,
          originalName: record.originalName,
          parseError: record.parseError,
          ordersCount: record._count.orders,
          items: record.items.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description,
            included: item.included,
            measureId: item.measureId,
          })),
        }}
      />
    </div>
  )
}
