import { MeasuresTable } from "@/components/platform/measures-table"
import { MeasuresPageActions } from "@/components/platform/resource-page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { listMeasures } from "@/lib/measures"

export default async function MeasuresPage() {
  const measures = await listMeasures()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Каталог мер ФСТЭК"
        description="Справочник мер информационной безопасности"
        actions={<MeasuresPageActions />}
      />

      <MeasuresTable
        initialMeasures={JSON.parse(JSON.stringify(measures))}
      />
    </div>
  )
}
