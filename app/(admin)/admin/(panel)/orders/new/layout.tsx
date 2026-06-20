import { OrderCreateDraftProvider } from "@/components/admin/order-create-draft"

export default function NewOrderLayout({ children }: { children: React.ReactNode }) {
  return <OrderCreateDraftProvider>{children}</OrderCreateDraftProvider>
}
