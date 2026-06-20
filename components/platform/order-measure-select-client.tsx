"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { FormSkeleton } from "@/components/shared/form-skeleton"
import { MeasureSelectTable } from "@/components/platform/measure-select-table"
import {
  useOrderCreateDraft,
  type OrderCreateMeasure,
} from "@/components/platform/order-create-draft"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

export function OrderMeasureSelectClient() {
  const router = useRouter()
  const { draft, selectedIds, setSelectedMeasureIds, setMeasuresCache } =
    useOrderCreateDraft()
  const hasCache = draft.measuresCache.length > 0
  const [measures, setMeasures] = useState<OrderCreateMeasure[]>(draft.measuresCache)
  const [loading, setLoading] = useState(!hasCache)

  useEffect(() => {
    if (hasCache) return
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
  }, [hasCache, setMeasuresCache])

  function handleSelectionChange(next: Set<number>) {
    setSelectedMeasureIds([...next])
  }

  if (loading) return <FormSkeleton fields={3} />

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
