import type {
  MeasuresTableItem,
  MeasuresTableStatus,
} from "@/components/shared/measures-data-table"

export type PublicStatus = MeasuresTableStatus

export type PublicItem = MeasuresTableItem & {
  orderId: number
  orderTitle: string
  orderIssuedAt: string
}
