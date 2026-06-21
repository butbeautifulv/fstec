import Link from "next/link"
import { Suspense } from "react"
import { MeasureImportsTable } from "@/components/platform/measure-imports-table"
import { PageHeader } from "@/components/shared/page-header"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { Button } from "@/components/ui/button"
import { listMeasureImports } from "@/lib/measure-imports"

async function ImportsTableSection() {
  const imports = await listMeasureImports()
  const rows = imports.map((item) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    uploadedVia: item.uploadedVia,
    documentNumber: item.documentNumber,
    originalName: item.originalName,
    title: item.title,
    reportDueAt: item.reportDueAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    _count: item._count,
  }))
  return <MeasureImportsTable initialImports={rows} />
}

export default function MeasureImportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Письма"
        description="Загрузка писем ФСТЭК в формате DOCX и извлечение мер"
        backHref="/panel"
        backLabel="Платформа"
        actions={
          <Button asChild>
            <Link href="/panel/measures/imports/new">Загрузить документ</Link>
          </Button>
        }
      />
      <Suspense fallback={<TablePageSkeleton />}>
        <ImportsTableSection />
      </Suspense>
    </div>
  )
}
