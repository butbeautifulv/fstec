import Link from "next/link"
import { MeasuresTable } from "@/components/admin/measures-table"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { listMeasures } from "@/lib/measures"

export default async function MeasuresPage() {
  const measures = await listMeasures()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Каталог мер ФСТЭК"
        description="Справочник мер информационной безопасности"
        actions={
          <Button asChild>
            <Link href="/admin/measures/new">Добавить меру</Link>
          </Button>
        }
      />

      <MeasuresTable
        initialMeasures={JSON.parse(JSON.stringify(measures))}
      />
    </div>
  )
}
