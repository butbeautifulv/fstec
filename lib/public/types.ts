import type {
  MeasuresTableItem,
  MeasuresTableStatus,
} from "@/lib/measures/table-types"

export type PublicStatus = MeasuresTableStatus

export type PublicItem = MeasuresTableItem & {
  orderId: number
  orderTitle: string
  orderIssuedAt: string
}
