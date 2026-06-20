import { OrderMeasureSelectClient } from "@/components/platform/order-measure-select-client"
import { listMeasures } from "@/lib/measures"
import { serializeMeasures } from "@/lib/serialize/panel"

export default async function OrderMeasureSelectPage() {
  const measures = await listMeasures()

  return (
    <OrderMeasureSelectClient
      initialMeasures={serializeMeasures(measures).map((measure) => ({
        id: measure.id,
        name: measure.name,
        code: measure.code,
        createdAt: measure.createdAt,
      }))}
    />
  )
}
