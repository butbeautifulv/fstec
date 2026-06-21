import Link from "next/link"
import { Suspense } from "react"
import { MeasureImportsTable } from "@/components/platform/measure-imports-table"
import { PageHeader } from "@/components/shared/page-header"
import { TableOnlySkeleton } from "@/components/shared/skeletons/table-only-skeleton"
import { Button } from "@/components/ui/button"
import { listMeasureImports } from "@/lib/measure-imports"
import { serializeMeasureImports } from "@/lib/serialize/panel"

async function ImportsTableSection() {
  const imports = await listMeasureImports()
  return <MeasureImportsTable initialImports={serializeMeasureImports(imports)} />
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
      <Suspense fallback={<TableOnlySkeleton />}>
        <ImportsTableSection />
      </Suspense>
    </div>
  )
}
