"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { BatchTargetSelectTable } from "@/components/platform/batch-target-select-table"
import {
  buildSelectionFromSuggestions,
  DzoTargetsSummary,
  MeasureRoutingMatrix,
  type RoutingSuggestionRow,
  type TargetMeasureSelection,
} from "@/components/platform/measure-routing-matrix"
import { SelectedMeasuresTable } from "@/components/platform/selected-measures-table"
import {
  useOrderCreateDraft,
  type OrderCreateMeasure,
} from "@/components/platform/order-create-draft"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { FormCardAction, FormCardGrid } from "@/components/shared/form-card-grid"
import { FormPageSkeleton } from "@/components/shared/skeletons/form-page-skeleton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  expandBatchTargets,
  expandDzoTargets,
  expandHeadSubdivisionTargets,
  expandImportDefaultTargets,
  listSelectableBatchTargets,
  targetKey,
  type SupervisedOrg,
} from "@/lib/orders/batch-targets"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { ListChecks } from "lucide-react"

type OrderCreateClientProps = {
  organizations: SupervisedOrg[]
  headOrganizationId: number | null
  defaultDue: string
  initialImport?: {
    id: number
    documentNumber: string | null
    title: string | null
    originalName: string
    defaultTitle: string
    defaultDue: string
    measureIds: number[]
    measures: OrderCreateMeasure[]
  }
}

export function OrderCreateClient({
  organizations,
  headOrganizationId,
  defaultDue,
  initialImport,
}: OrderCreateClientProps) {
  const router = useRouter()
  const {
    draft,
    hydrated,
    updateDraft,
    clearDraft,
    setMeasuresCache,
    setSelectedMeasureIds,
    selectedIds,
  } = useOrderCreateDraft()

  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [dueOverride, setDueOverride] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const importPrefillApplied = useRef(false)
  const [targetMeasureSelection, setTargetMeasureSelection] =
    useState<TargetMeasureSelection>(new Map())
  const [routingSuggestions, setRoutingSuggestions] = useState<RoutingSuggestionRow[]>(
    []
  )

  const title =
    titleOverride ?? initialImport?.defaultTitle ?? draft.title ?? ""
  const due =
    dueOverride ?? initialImport?.defaultDue ?? draft.defaultDue ?? defaultDue

  const selectableTargets = useMemo(
    () => listSelectableBatchTargets(organizations),
    [organizations]
  )

  const defaultImportTargets = useMemo(
    () => expandImportDefaultTargets(organizations, headOrganizationId),
    [organizations, headOrganizationId]
  )

  const [selectedTargetKeys, setSelectedTargetKeys] = useState<Set<string>>(() => {
    if (initialImport) {
      return new Set(defaultImportTargets.map(targetKey))
    }
    return new Set()
  })

  useEffect(() => {
    if (!hydrated || !initialImport || importPrefillApplied.current) return
    updateDraft({
      title: initialImport.defaultTitle,
      defaultDue: initialImport.defaultDue,
      selectedMeasureIds: initialImport.measureIds,
      measuresCache: initialImport.measures,
      sourceImportId: initialImport.id,
    })
    importPrefillApplied.current = true
  }, [hydrated, initialImport, updateDraft])

  useEffect(() => {
    if (!hydrated || draft.measuresCache.length > 0) return
    if (draft.selectedMeasureIds.length === 0) return
    fetch("/api/measures")
      .then((r) => r.json())
      .then((data) => setMeasuresCache(data))
  }, [
    hydrated,
    draft.measuresCache.length,
    draft.selectedMeasureIds.length,
    setMeasuresCache,
  ])

  const selectedPreview = useMemo(() => {
    const byId = new Map(draft.measuresCache.map((m) => [m.id, m]))
    return draft.selectedMeasureIds
      .map((id) => byId.get(id))
      .filter((m): m is OrderCreateMeasure => m != null)
  }, [draft.measuresCache, draft.selectedMeasureIds])

  const selectedTargets = useMemo(
    () =>
      selectableTargets.filter((target) =>
        selectedTargetKeys.has(targetKey(target))
      ),
    [selectableTargets, selectedTargetKeys]
  )

  const headSubdivisionTargets = useMemo(
    () =>
      selectedTargets.filter(
        (t) =>
          headOrganizationId != null &&
          t.organizationId === headOrganizationId &&
          t.subdivisionId != null
      ),
    [selectedTargets, headOrganizationId]
  )

  useEffect(() => {
    if (!initialImport || headOrganizationId == null) return
    if (headSubdivisionTargets.length === 0) return

    fetch(
      `/api/measure-imports/${initialImport.id}/routing-suggestions?organizationId=${headOrganizationId}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.suggestions) return
        const suggestions = data.suggestions as RoutingSuggestionRow[]
        setRoutingSuggestions(suggestions)
        const built = buildSelectionFromSuggestions(
          selectedTargets,
          initialImport.measures,
          suggestions
        )
        setTargetMeasureSelection(built)
      })
      .catch(() => {})
  }, [initialImport, headOrganizationId, headSubdivisionTargets.length, selectedTargets])

  function selectImportDefaults() {
    setSelectedTargetKeys(new Set(defaultImportTargets.map(targetKey)))
  }

  function selectHeadTargets() {
    const keys = expandHeadSubdivisionTargets(organizations, headOrganizationId).map(
      targetKey
    )
    setSelectedTargetKeys((prev) => new Set([...prev, ...keys]))
  }

  function selectDzoTargets() {
    const keys = expandDzoTargets(organizations, headOrganizationId).map(targetKey)
    setSelectedTargetKeys((prev) => new Set([...prev, ...keys]))
  }

  function selectAllTargets() {
    setSelectedTargetKeys(new Set(selectableTargets.map((target) => targetKey(target))))
  }

  function handleRemoveMeasure(id: number) {
    setSelectedMeasureIds(draft.selectedMeasureIds.filter((measureId) => measureId !== id))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.size === 0 || selectedTargets.length === 0 || !due || !title.trim()) {
      return
    }

    setLoading(true)
    const res = await fetch("/api/orders/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        defaultDueAt: new Date(due).toISOString(),
        measureIds: [...selectedIds],
        sourceImportId: initialImport?.id ?? draft.sourceImportId,
        targets: selectedTargets.map((target) => {
          const key = targetKey(target)
          const perTarget = targetMeasureSelection.get(key)
          return {
            organizationId: target.organizationId,
            subdivisionId: target.subdivisionId,
            measureIds:
              perTarget && perTarget.size > 0 ? [...perTarget] : [...selectedIds],
          }
        }),
      }),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось создать поручения")
      return
    }

    const data = await res.json()
    clearDraft()
    notify.success(`Создано поручений: ${data.count}`)
    const importId = initialImport?.id ?? draft.sourceImportId
    router.push(
      importId != null
        ? `/panel/orders?sourceImportId=${importId}`
        : "/panel/orders"
    )
    router.refresh()
  }

  if (!hydrated) return <FormPageSkeleton fields={5} showBack={false} />

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormCardGrid singleCard>
        <Card>
          <CardHeader>
            <CardTitle>Параметры поручений</CardTitle>
            <CardDescription>
              {selectedIds.size} мер будут назначены каждой выбранной {labels.orgGenitive}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Название</FieldLabel>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitleOverride(e.target.value)}
                  className="w-full"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="due">Срок исполнения</FieldLabel>
                <Input
                  id="due"
                  type="datetime-local"
                  value={due}
                  onChange={(e) => setDueOverride(e.target.value)}
                  className="w-full"
                  required
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </FormCardGrid>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Меры</CardTitle>
            <CardDescription>
              {selectedIds.size > 0
                ? `Выбрано мер: ${selectedIds.size}`
                : "Выберите меры из каталога"}
            </CardDescription>
          </div>
          {initialImport && (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/panel/measures/imports/${initialImport.id}`}>
                Вернуться к письму
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SelectedMeasuresTable
            measures={selectedPreview}
            onRemove={handleRemoveMeasure}
          />
          <FormCardAction>
            <Button type="button" variant="outline" asChild>
              <Link href="/panel/orders/new/measures">
                <ListChecks data-icon="inline-start" />
                Выбрать меры
              </Link>
            </Button>
          </FormCardAction>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Кому назначить</CardTitle>
            <CardDescription>
              Головная организация (подразделения) и подведомственные {labels.orgs.toLowerCase()}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {initialImport && (
              <Button type="button" variant="outline" size="sm" onClick={selectImportDefaults}>
                МАШ + все ДЗО
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={selectHeadTargets}>
              Только МАШ
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectDzoTargets}>
              Все ДЗО
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectAllTargets}>
              Выбрать всех
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedTargetKeys(new Set())}
            >
              Снять выбор
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <BatchTargetSelectTable
            targets={selectableTargets}
            selectedKeys={selectedTargetKeys}
            onSelectionChange={setSelectedTargetKeys}
          />
          {initialImport && selectedTargets.length > 0 && (
            <div className="mt-6 flex flex-col gap-6">
              <MeasureRoutingMatrix
                targets={selectedTargets}
                measures={initialImport.measures}
                selection={targetMeasureSelection}
                suggestions={routingSuggestions}
                onSelectionChange={setTargetMeasureSelection}
              />
              <DzoTargetsSummary
                targets={selectedTargets}
                measures={initialImport.measures}
                selection={targetMeasureSelection}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={loading || selectedIds.size === 0 || selectedTargets.length === 0}
        >
          {loading && <Spinner data-icon="inline-start" />}
          Создать {selectedTargets.length} поручений
        </Button>
      </FormActionsBar>
    </form>
  )
}
