"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { FormActionsBar } from "@/components/admin/form-actions-bar"
import { FormSkeleton } from "@/components/admin/form-skeleton"
import { useOrderCreateDraft } from "@/components/admin/order-create-draft"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"
import { labels } from "@/lib/ui/branding"
import { ListChecks } from "lucide-react"

type Org = { id: number; name: string; subdivisions: { id: number; name: string }[] }

const PREVIEW_LIMIT = 5

export function OrderCreateForm() {
  const router = useRouter()
  const {
    draft,
    hydrated,
    updateDraft,
    clearDraft,
    setMeasuresCache,
    selectedIds,
  } = useOrderCreateDraft()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [defaultOrgApplied, setDefaultOrgApplied] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    Promise.all([
      fetch("/api/organizations").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([o, settings]) => {
      setOrgs(o)
      if (!draft.organizationId && !defaultOrgApplied) {
        const headId = settings.headOrganization?.id as number | undefined
        const defaultOrg =
          headId != null && o.some((org: Org) => org.id === headId)
            ? headId
            : o[0]?.id
        if (defaultOrg != null) {
          updateDraft({ organizationId: String(defaultOrg) })
        }
        setDefaultOrgApplied(true)
      }
      setDataLoading(false)
    })
  }, [hydrated, draft.organizationId, defaultOrgApplied, updateDraft])

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

  const selectedOrg = useMemo(
    () => orgs.find((o) => String(o.id) === draft.organizationId),
    [orgs, draft.organizationId]
  )

  const selectedPreview = useMemo(() => {
    const byId = new Map(draft.measuresCache.map((m) => [m.id, m]))
    return draft.selectedMeasureIds
      .map((id) => byId.get(id))
      .filter((m): m is NonNullable<typeof m> => m != null)
  }, [draft.measuresCache, draft.selectedMeasureIds])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.organizationId || selectedIds.size === 0 || !draft.defaultDue) return
    setLoading(true)
    const dueAt = new Date(draft.defaultDue).toISOString()
    const subdivisionId =
      draft.bulkSubdivisionId !== "none" ? Number(draft.bulkSubdivisionId) : null
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        organizationId: Number(draft.organizationId),
        defaultDueAt: dueAt,
        items: [...selectedIds].map((measureId) => ({
          measureId,
          dueAt,
          subdivisionId,
        })),
      }),
    })
    setLoading(false)
    if (res.ok) {
      const order = await res.json()
      clearDraft()
      notify.success("Поручение создано")
      router.push(`/admin/orders/${order.id}`)
      router.refresh()
    } else {
      notify.error("Не удалось создать поручение")
    }
  }

  if (!hydrated || dataLoading) return <FormSkeleton fields={5} />

  const previewItems = selectedPreview.slice(0, PREVIEW_LIMIT)
  const previewRest = selectedPreview.length - previewItems.length

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметры поручения</CardTitle>
          <CardDescription>Организация, срок и подразделение для всех мер</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Название поручения</FieldLabel>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org">{labels.org}</FieldLabel>
              <Select
                value={draft.organizationId}
                onValueChange={(value) => updateDraft({ organizationId: value })}
              >
                <SelectTrigger id="org" className="w-full">
                  <SelectValue placeholder={`Выберите ${labels.org.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="due">Срок исполнения (для всех мер)</FieldLabel>
              <Input
                id="due"
                type="date"
                value={draft.defaultDue}
                onChange={(e) => updateDraft({ defaultDue: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="subdivision">
                Подразделение (для всех выбранных мер)
              </FieldLabel>
              <Select
                value={draft.bulkSubdivisionId}
                onValueChange={(value) => updateDraft({ bulkSubdivisionId: value })}
              >
                <SelectTrigger id="subdivision" className="w-full">
                  <SelectValue placeholder="Не назначено" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Не назначено</SelectItem>
                    {selectedOrg?.subdivisions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Меры</CardTitle>
          <CardDescription>
            {selectedIds.size > 0
              ? `Выбрано мер: ${selectedIds.size}`
              : "Выберите меры из каталога ФСТЭК"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {selectedPreview.length > 0 && (
            <ul className="space-y-1 text-sm">
              {previewItems.map((m) => (
                <li key={m.id} className="text-muted-foreground">
                  {m.name}
                  {m.code ? (
                    <span className="ml-2 font-mono text-xs">{m.code}</span>
                  ) : null}
                </li>
              ))}
              {previewRest > 0 && (
                <li className="text-muted-foreground">и ещё {previewRest}</li>
              )}
            </ul>
          )}
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/orders/new/measures">
              <ListChecks data-icon="inline-start" />
              Выбрать меры
            </Link>
          </Button>
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Отмена
        </Button>
        <Button type="submit" disabled={loading || selectedIds.size === 0}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Создание..." : "Создать поручение"}
        </Button>
      </FormActionsBar>
    </form>
  )
}
