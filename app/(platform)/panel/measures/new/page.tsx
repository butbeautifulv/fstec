import { MeasureForm } from "@/components/platform/measure-form"
import { PageHeader } from "@/components/shared/page-header"

export default function NewMeasurePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новая мера"
        description="Добавление меры в каталог ФСТЭК"
        backHref="/panel/measures"
        backLabel="Каталог мер"
      />
      <MeasureForm />
    </div>
  )
}
