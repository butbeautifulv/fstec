"use client"

import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import type { UserRole } from "@prisma/client"
import { parseApiError, useCrudSubmit } from "@/components/platform/crud/use-crud-submit"
import { FormActionsBar } from "@/components/shared/form-actions-bar"
import { PasswordFieldsGroup } from "@/components/platform/password-fields-group"
import { useAdminMe } from "@/components/platform/use-platform-user"
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
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/auth/permissions"
import { validatePassword } from "@/lib/auth/password-policy"
import { notify } from "@/lib/ui/feedback"

type User = {
  id: number
  email: string
  name: string
  role: UserRole
}

export function UserForm({ user }: { user?: User }) {
  const router = useRouter()
  const isEdit = user != null
  const [email, setEmail] = useState(user?.email ?? "")
  const [name, setName] = useState(user?.name ?? "")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [role, setRole] = useState<UserRole>(user?.role ?? "OPERATOR")
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const { me } = useAdminMe()

  const isSelf = isEdit && me != null && me.id === user.id

  const passwordValid = useMemo(() => {
    if (!isEdit && !password) return false
    if (isEdit && !password) return true
    return (
      validatePassword(password).valid &&
      password === passwordConfirm
    )
  }, [isEdit, password, passwordConfirm])

  const submitFn = useCallback(async () => {
    const payload = isEdit
      ? {
          email,
          name,
          role,
          ...(password
            ? { password, passwordConfirm, mustChangePassword }
            : {}),
        }
      : {
          email,
          name,
          password,
          passwordConfirm,
          role,
          mustChangePassword,
        }

    const res = await fetch(isEdit ? `/api/users/${user.id}` : "/api/users", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      notify.success(isEdit ? "Пользователь обновлён" : "Пользователь добавлен")
      router.push("/panel/settings/users")
      router.refresh()
      return { ok: true as const }
    }

    return {
      ok: false as const,
      error: await parseApiError(res, isEdit ? "Ошибка сохранения" : "Ошибка создания"),
    }
  }, [
    email,
    isEdit,
    mustChangePassword,
    name,
    password,
    passwordConfirm,
    role,
    router,
    user,
  ])

  const { loading, error, submit } = useCrudSubmit(submitFn)

  const canSubmit =
    email.trim().length > 0 && name.trim().length > 0 && passwordValid

  return (
    <div className="flex flex-col gap-4">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Учётная запись</CardTitle>
          <CardDescription>
            {isEdit
              ? "Изменение данных пользователя админ-панели"
              : "Доступ в админ-панель с выбранной ролью"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-name">Имя</FieldLabel>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-role">Роль</FieldLabel>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
                disabled={isSelf}
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSelf && (
                <FieldDescription>
                  Нельзя изменить собственную роль
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Новый пароль" : "Пароль"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Заполните только если нужно сменить пароль"
              : "Пароль для первого входа"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordFieldsGroup
            password={password}
            passwordConfirm={passwordConfirm}
            onPasswordChange={setPassword}
            onPasswordConfirmChange={setPasswordConfirm}
            required={!isEdit}
            showTemporary={!isEdit || password.length > 0}
            mustChangePassword={mustChangePassword}
            onMustChangePasswordChange={setMustChangePassword}
          />
        </CardContent>
      </Card>

      <FormActionsBar error={error}>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Отмена
        </Button>
        <Button type="button" onClick={() => void submit()} disabled={loading || !canSubmit}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading
            ? isEdit
              ? "Сохранение..."
              : "Добавление..."
            : isEdit
              ? "Сохранить"
              : "Добавить"}
        </Button>
      </FormActionsBar>
    </div>
  )
}
