import { MeasureForm } from "@/components/admin/measure-form"
import { PageHeader } from "@/components/admin/page-header"

export default function NewMeasurePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новая мера"
        description="Добавление меры в каталог ФСТЭК"
        backHref="/admin/measures"
        backLabel="Каталог мер"
      />
      <MeasureForm />
    </div>
  )
}
