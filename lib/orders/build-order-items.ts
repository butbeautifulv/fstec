export function buildOrderItemsCreate(input: {
  measureIds: number[]
  dueAt: Date
  statusId: number
  subdivisionId?: number | null
}) {
  return input.measureIds.map((measureId) => ({
    measureId,
    dueAt: input.dueAt,
    statusId: input.statusId,
    subdivisionId: input.subdivisionId ?? null,
  }))
}
