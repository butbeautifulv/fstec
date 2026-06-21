import { OrderCreateClient } from "@/components/platform/order-create-client"
import { PageHeader } from "@/components/shared/page-header"
import { loadOrderCreateContext } from "@/lib/orders/order-create-context"

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ importId?: string }>
}) {
  const { importId: importIdRaw } = await searchParams
  const importId =
    importIdRaw != null && !Number.isNaN(Number(importIdRaw))
      ? Number(importIdRaw)
      : undefined

  const context = await loadOrderCreateContext({ importId })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новое поручение"
        description={
          context.importRecord
            ? `Меры из документа ${context.importRecord.documentNumber ?? context.importRecord.originalName}`
            : "Пакетное назначение мер подведомственным организациям"
        }
        backHref={
          context.importRecord
            ? `/panel/measures/imports/${context.importRecord.id}`
            : "/panel/orders"
        }
        backLabel={context.importRecord ? "Письмо" : "Поручения"}
      />
      <OrderCreateClient
        organizations={context.organizations}
        defaultDue={context.defaultDue}
        initialImport={
          context.importRecord
            ? {
                id: context.importRecord.id,
                documentNumber: context.importRecord.documentNumber,
                title: context.importRecord.title,
                originalName: context.importRecord.originalName,
                defaultTitle: context.defaultTitle,
                defaultDue: context.defaultDue,
                measureIds: context.measureIds,
                measures: context.measures,
              }
            : undefined
        }
      />
    </div>
  )
}
