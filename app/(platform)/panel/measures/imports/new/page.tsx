import { MeasureImportUploadForm } from "@/components/platform/measure-import-upload-form"
import { PageHeader } from "@/components/shared/page-header"
import { listMeasureImports } from "@/lib/measure-imports"

export default async function NewMeasureImportPage() {
  const imports = await listMeasureImports()
  const parentOptions = imports
    .filter((item) => item.kind === "LETTER")
    .map((item) => ({
      id: item.id,
      label: item.documentNumber ?? item.originalName,
    }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Загрузка DOCX"
        description="Письмо или приложение ФСТЭК"
        backHref="/panel/measures/imports"
        backLabel="Письма"
      />
      <MeasureImportUploadForm parentOptions={parentOptions} />
    </div>
  )
}
