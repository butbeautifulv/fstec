"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { FormActionsBar } from "@/components/admin/form-actions-bar"
import { FormSkeleton } from "@/components/admin/form-skeleton"
import { MeasurePicker } from "@/components/admin/measure-picker"
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

type Measure = { id: number; name: string; code: string | null }
type Org = { id: number; name: string; subdivisions: { id: number; name: string }[] }

export function OrderCreateForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [organizationId, setOrganizationId] = useState<string>("")
  const [defaultDue, setDefaultDue] = useState("")
  const [bulkSubdivisionId, setBulkSubdivisionId] = useState<string>("none")
  const [measures, setMeasures] = useState<Measure[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/measures").then((r) => r.json()),
      fetch("/api/organizations").then((r) => r.json()),
    ]).then(([m, o]) => {
      setMeasures(m)
      setOrgs(o)
      if (o[0]) setOrganizationId(String(o[0].id))
      setDataLoading(false)
    })
  }, [])

  const selectedOrg = useMemo(
    () => orgs.find((o) => String(o.id) === organizationId),
    [orgs, organizationId]
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!organizationId || selected.size === 0 || !defaultDue) return
    setLoading(true)
    const dueAt = new Date(defaultDue).toISOString()
    const subdivisionId =
      bulkSubdivisionId !== "none" ? Number(bulkSubdivisionId) : null
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        organizationId: Number(organizationId),
        defaultDueAt: dueAt,
        items: [...selected].map((measureId) => ({
          measureId,
          dueAt,
          subdivisionId,
        })),
      }),
    })
    setLoading(false)
    if (res.ok) {
      const order = await res.json()
      notify.success("Поручение создано")
      router.push(`/admin/orders/${order.id}`)
      router.refresh()
    } else {
      notify.error("Не удалось создать поручение")
    }
  }

  if (dataLoading) return <FormSkeleton fields={5} />

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="org">{labels.org}</FieldLabel>
                <Select value={organizationId} onValueChange={setOrganizationId}>
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
                  value={defaultDue}
                  onChange={(e) => setDefaultDue(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="subdivision">
                  Подразделение (для всех выбранных мер)
                </FieldLabel>
                <Select value={bulkSubdivisionId} onValueChange={setBulkSubdivisionId}>
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
              {selected.size > 0
                ? `Выбрано мер: ${selected.size}`
                : "Выберите меры из каталога ФСТЭК"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MeasurePicker measures={measures} selected={selected} onChange={setSelected} />
          </CardContent>
        </Card>
      </div>

      <FormActionsBar>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Отмена
        </Button>
        <Button type="submit" disabled={loading || selected.size === 0}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Создание..." : "Создать поручение"}
        </Button>
      </FormActionsBar>
    </form>
  )
}
