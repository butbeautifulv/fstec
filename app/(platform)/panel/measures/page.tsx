import { Suspense } from "react"
import { MeasuresTable } from "@/components/platform/measures-table"
import { MeasuresPageActions } from "@/components/platform/resource-page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { getCachedListMeasures } from "@/lib/cache/list-measures"
import { serializeMeasures } from "@/lib/serialize/panel"

async function MeasuresTableSection() {
  const measures = await getCachedListMeasures()
  return <MeasuresTable initialMeasures={serializeMeasures(measures)} />
}

export default function MeasuresPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Каталог мер ФСТЭК"
        description="Справочник мер информационной безопасности"
        actions={<MeasuresPageActions />}
      />

      <Suspense fallback={<TablePageSkeleton />}>
        <MeasuresTableSection />
      </Suspense>
    </div>
  )
}
