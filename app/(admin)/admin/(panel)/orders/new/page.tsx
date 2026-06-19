import { OrderCreateForm } from "@/components/admin/order-create-form"
import { PageHeader } from "@/components/admin/page-header"
import { labels } from "@/lib/ui/branding"

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Новое поручение"
        description={`Назначение мер ${labels.orgGenitive}`}
        backHref="/admin/orders"
        backLabel="Поручения"
      />
      <OrderCreateForm />
    </div>
  )
}
