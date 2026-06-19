import { notFound } from "next/navigation"
import { MeasureForm } from "@/components/admin/measure-form"
import { PageHeader } from "@/components/admin/page-header"
import { getMeasure } from "@/lib/measures"

type Params = { params: Promise<{ id: string }> }

export default async function EditMeasurePage({ params }: Params) {
  const id = Number((await params).id)
  const measure = await getMeasure(id)
  if (!measure) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Редактирование меры"
        description={measure.name}
        backHref="/admin/measures"
        backLabel="Каталог мер"
      />
      <MeasureForm
        measureId={measure.id}
        initial={{
          name: measure.name,
          description: measure.description,
          code: measure.code,
        }}
      />
    </div>
  )
}
