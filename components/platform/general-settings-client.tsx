"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import type { LocaleId } from "@/lib/i18n/locales"
import { parseApiError, useCrudSubmit } from "@/components/platform/crud/use-crud-submit"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { PageHeader } from "@/components/shared/page-header"
import { useLocale } from "@/components/locale-provider"
import { useTimezone } from "@/components/timezone-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales"
import { TIMEZONE_OPTIONS } from "@/lib/datetime/timezones"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"

type Org = { id: number; name: string }

type GeneralSettingsState = {
  headOrganizationId: number | null
  timezone: string
  locale: LocaleId
}

export function GeneralSettingsClient({
  initialSettings,
  organizations,
}: {
  initialSettings: GeneralSettingsState
  organizations: Org[]
}) {
  const router = useRouter()
  const { setTimeZone } = useTimezone()
  const { refreshLocale } = useLocale()
  const [headOrganizationId, setHeadOrganizationId] = useState<string>(
    initialSettings.headOrganizationId != null
      ? String(initialSettings.headOrganizationId)
      : "none"
  )
  const [timezone, setTimezone] = useState(initialSettings.timezone)
  const [locale, setLocale] = useState<LocaleId>(initialSettings.locale)

  const saveSettingsFn = useCallback(async () => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headOrganizationId:
          headOrganizationId === "none" ? null : Number(headOrganizationId),
        timezone,
        locale,
      }),
    })
    if (res.ok) {
      const saved = await res.json()
      setTimeZone(saved.timezone)
      refreshLocale()
      notify.success("Настройки сохранены")
      router.refresh()
      return { ok: true as const }
    }
    return {
      ok: false as const,
      error: await parseApiError(res, "Ошибка сохранения"),
    }
  }, [headOrganizationId, timezone, locale, router, setTimeZone, refreshLocale])

  const { loading, error, submit } = useCrudSubmit(saveSettingsFn)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Общие"
        description="Системные параметры приложения"
        backHref="/panel/settings"
        backLabel="Настройки"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Общие</CardTitle>
          <CardDescription>
            Головная {labels.org.toLowerCase()}, часовой пояс и язык по умолчанию
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="head-org">Головная {labels.org.toLowerCase()}</FieldLabel>
              <Select value={headOrganizationId} onValueChange={setHeadOrganizationId}>
                <SelectTrigger id="head-org" className="w-full max-w-md">
                  <SelectValue placeholder={`Выберите ${labels.org.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбрана</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="timezone">Часовой пояс</FieldLabel>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone" className="w-full max-w-md">
                  <SelectValue placeholder="Часовой пояс" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="global-locale">Язык системы</FieldLabel>
              <Select value={locale} onValueChange={(v) => setLocale(v as LocaleId)}>
                <SelectTrigger id="global-locale" className="w-full max-w-md">
                  <SelectValue placeholder="Язык" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LOCALES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <FormActionsBar error={error}>
        <Button type="button" onClick={() => void submit()} disabled={loading}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Сохранение..." : "Сохранить"}
        </Button>
      </FormActionsBar>
    </div>
  )
}
