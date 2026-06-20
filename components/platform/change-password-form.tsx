"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { PasswordFieldsGroup } from "@/components/platform/password-fields-group"
import { PasswordInputField } from "@/components/platform/password-input-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { validatePassword } from "@/lib/auth/password-policy"
import { cn } from "@/lib/utils"

export function ChangePasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit =
    currentPassword.length > 0 &&
    validatePassword(newPassword).valid &&
    newPassword === passwordConfirm

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        passwordConfirm,
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Ошибка смены пароля")
      return
    }

    router.push("/panel")
    router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Смена пароля</CardTitle>
          <CardDescription>
            Установите новый пароль для продолжения работы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <PasswordInputField
                id="current-password"
                label="Текущий пароль"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                required
              />

              <PasswordFieldsGroup
                password={newPassword}
                passwordConfirm={passwordConfirm}
                onPasswordChange={setNewPassword}
                onPasswordConfirmChange={setPasswordConfirm}
                required
                showTemporary={false}
                passwordLabel="Новый пароль"
                confirmLabel="Подтверждение нового пароля"
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field>
                <Button type="submit" disabled={loading || !canSubmit} className="w-full">
                  {loading && <Spinner data-icon="inline-start" />}
                  {loading ? "Сохранение..." : "Сохранить пароль"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
