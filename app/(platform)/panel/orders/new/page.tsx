import { OrderCreateForm } from "@/components/platform/order-create-form"
import { PageHeader } from "@/components/shared/page-header"
import { labels } from "@/lib/ui/branding"

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новое поручение"
        description={`Назначение мер ${labels.orgGenitive}`}
        backHref="/panel/orders"
        backLabel="Поручения"
      />
      <OrderCreateForm />
    </div>
  )
}
