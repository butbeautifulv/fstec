import Link from "next/link"
import { Suspense } from "react"
import { MeasureImportsTable } from "@/components/platform/measure-imports-table"
import {
  DashboardPeriodSection,
  DASHBOARD_PERIOD_LABELS,
} from "@/components/dashboard/dashboard-period-section"
import { PageHeader } from "@/components/shared/page-header"
import { boundsFromIsoDates } from "@/lib/dashboard/period-filter-rows"
import { listMeasureImports } from "@/lib/measure-imports"
import { serializeMeasureImports } from "@/lib/serialize/panel"
import { Button } from "@/components/ui/button"

export default async function MeasureImportsPage() {
  const imports = await listMeasureImports()
  const lettersOnly = imports.filter((row) => row.kind === "LETTER")
  const rows = serializeMeasureImports(lettersOnly)
  const bounds = boundsFromIsoDates(rows.map((row) => row.createdAt))

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
      <DashboardPeriodSection
        bounds={bounds}
        label={DASHBOARD_PERIOD_LABELS.imports}
      />
      <Suspense fallback={null}>
        <MeasureImportsTable initialImports={rows} />
      </Suspense>
    </div>
  )
}
