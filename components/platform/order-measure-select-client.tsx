"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { TablePageSkeleton } from "@/components/shared/skeletons/table-page-skeleton"
import { MeasureSelectTable } from "@/components/platform/measure-select-table"
import {
  useOrderCreateDraft,
  type OrderCreateMeasure,
} from "@/components/platform/order-create-draft"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

type OrderMeasureSelectClientProps = {
  initialMeasures?: OrderCreateMeasure[]
}

export function OrderMeasureSelectClient({
  initialMeasures,
}: OrderMeasureSelectClientProps = {}) {
  const router = useRouter()
  const { draft, selectedIds, setSelectedMeasureIds, setMeasuresCache } =
    useOrderCreateDraft()
  const hasCache = draft.measuresCache.length > 0
  const hasInitialMeasures = initialMeasures != null && initialMeasures.length > 0
  const [measures, setMeasures] = useState<OrderCreateMeasure[]>(
    hasCache ? draft.measuresCache : (initialMeasures ?? [])
  )
  const [loading, setLoading] = useState(!hasCache && !hasInitialMeasures)

  useEffect(() => {
    if (hasCache) return
    if (hasInitialMeasures) {
      setMeasuresCache(initialMeasures)
      return
    }
    let cancelled = false
    fetch("/api/measures")
      .then((r) => r.json())
      .then((data: OrderCreateMeasure[]) => {
        if (cancelled) return
        setMeasures(data)
        setMeasuresCache(data)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [hasCache, hasInitialMeasures, initialMeasures, setMeasuresCache])

  function handleSelectionChange(next: Set<number>) {
    setSelectedMeasureIds([...next])
  }

  if (loading) return <TablePageSkeleton columns={6} />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Выбор мер"
        description="Поиск, сортировка и выбор мер для нового поручения"
        backHref="/panel/orders/new"
        backLabel="Новое поручение"
      />

      <MeasureSelectTable
        measures={measures}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      />

      <FormActionsBar>
        <span className="text-sm text-muted-foreground">
          Выбрано: {selectedIds.size}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/panel/orders/new">Назад</Link>
          </Button>
          <Button type="button" onClick={() => router.push("/panel/orders/new")}>
            Готово
          </Button>
        </div>
      </FormActionsBar>
    </div>
  )
}
