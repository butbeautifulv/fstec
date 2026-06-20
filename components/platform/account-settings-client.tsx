"use client"

import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import type { LocaleId } from "@/lib/i18n/locales"
import { parseApiError, useCrudSubmit } from "@/components/platform/crud/use-crud-submit"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { PageHeader } from "@/components/shared/page-header"
import { PasswordFieldsGroup } from "@/components/platform/password-fields-group"
import { PasswordInputField } from "@/components/platform/password-input-field"
import { useLocale } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ROLE_LABELS } from "@/lib/auth/permissions"
import { validatePassword } from "@/lib/auth/password-policy"
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales"
import { notify } from "@/lib/ui/feedback"
import type { UserRole } from "@prisma/client"

type AccountState = {
  email: string
  name: string
  role: UserRole
  locale: LocaleId | null
}

export function AccountSettingsClient({ initialAccount }: { initialAccount: AccountState }) {
  const router = useRouter()
  const { refreshLocale } = useLocale()
  const [email, setEmail] = useState(initialAccount.email)
  const [name, setName] = useState(initialAccount.name)
  const [locale, setLocale] = useState<string>(
    initialAccount.locale ?? "system"
  )
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")

  const passwordValid = useMemo(() => {
    if (!password) return true
    return (
      currentPassword.length > 0 &&
      validatePassword(password).valid &&
      password === passwordConfirm
    )
  }, [password, passwordConfirm, currentPassword])

  const saveFn = useCallback(async () => {
    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        locale: locale === "system" ? null : locale,
        ...(password ? { currentPassword, password, passwordConfirm } : {}),
      }),
    })
    if (res.ok) {
      refreshLocale()
      notify.success("Учётная запись обновлена")
      router.refresh()
      return { ok: true as const }
    }
    return {
      ok: false as const,
      error: await parseApiError(res, "Ошибка сохранения"),
    }
  }, [email, name, locale, currentPassword, password, passwordConfirm, router, refreshLocale])

  const { loading, error, submit } = useCrudSubmit(saveFn)

  const canSubmit = email.trim().length > 0 && name.trim().length > 0 && passwordValid

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Учётная запись"
        description="Личные данные и предпочтения"
        backHref="/panel/settings"
        backLabel="Настройки"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Профиль</CardTitle>
          <CardDescription>Имя, email и роль (только для просмотра)</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-email">Email</FieldLabel>
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-name">Имя</FieldLabel>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-role">Роль</FieldLabel>
              <Input
                id="account-role"
                value={ROLE_LABELS[initialAccount.role]}
                disabled
                readOnly
              />
              <FieldDescription>Роль назначается администратором</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-locale">Язык интерфейса</FieldLabel>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger id="account-locale" className="w-full max-w-md">
                  <SelectValue placeholder="Язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Системный по умолчанию</SelectItem>
                  {SUPPORTED_LOCALES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Пока влияет только на атрибут lang страницы; перевод UI — позже
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Новый пароль</CardTitle>
          <CardDescription>Оставьте пустым, если менять пароль не нужно</CardDescription>
        </CardHeader>
        <CardContent>
          {password.length > 0 && (
            <div className="mb-4">
              <PasswordInputField
                id="account-current-password"
                label="Текущий пароль"
                value={currentPassword}
                onChange={setCurrentPassword}
                required
                autoComplete="current-password"
              />
            </div>
          )}
          <PasswordFieldsGroup
            password={password}
            passwordConfirm={passwordConfirm}
            onPasswordChange={setPassword}
            onPasswordConfirmChange={setPasswordConfirm}
            required={false}
            showTemporary={false}
          />
        </CardContent>
      </Card>

      <FormActionsBar error={error}>
        <Button type="button" onClick={() => void submit()} disabled={loading || !canSubmit}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Сохранение..." : "Сохранить"}
        </Button>
      </FormActionsBar>
    </div>
  )
}
