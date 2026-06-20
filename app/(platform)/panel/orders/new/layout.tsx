import { OrderCreateDraftProvider } from "@/components/platform/order-create-draft"

export default function NewOrderLayout({ children }: { children: React.ReactNode }) {
  return <OrderCreateDraftProvider>{children}</OrderCreateDraftProvider>
}
