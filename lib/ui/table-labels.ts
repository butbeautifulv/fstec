export type TableLabels = {
  measure: string
  order: string
  organization: string
  subdivision: string
  status: string
  code: string
  dueAt: string
  issuedAt: string
  itemCount: string
  searchWithOrder: string
  searchWithoutOrder: string
  measuresNotFound: string
}

export const FSTEC_TABLE_LABELS: TableLabels = {
  measure: "Мера",
  order: "Поручение",
  organization: "Организация",
  subdivision: "Подразделение",
  status: "Статус",
  code: "Код",
  dueAt: "Срок",
  issuedAt: "Выдано",
  itemCount: "Мер",
  searchWithOrder: "Поиск по мере, коду, поручению…",
  searchWithoutOrder: "Поиск по мере, коду…",
  measuresNotFound: "Меры не найдены",
}
