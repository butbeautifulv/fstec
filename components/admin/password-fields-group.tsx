"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, RefreshCw } from "lucide-react"
import { PasswordInputField } from "@/components/admin/password-input-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  generateSecurePassword,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/password-policy"
import { notify } from "@/lib/ui/feedback"
import { cn } from "@/lib/utils"

type PasswordFieldsGroupProps = {
  password: string
  passwordConfirm: string
  onPasswordChange: (value: string) => void
  onPasswordConfirmChange: (value: string) => void
  required?: boolean
  showTemporary?: boolean
  mustChangePassword?: boolean
  onMustChangePasswordChange?: (value: boolean) => void
  passwordLabel?: string
  confirmLabel?: string
}

export function PasswordFieldsGroup({
  password,
  passwordConfirm,
  onPasswordChange,
  onPasswordConfirmChange,
  required = true,
  showTemporary = true,
  mustChangePassword = false,
  onMustChangePasswordChange,
  passwordLabel = "Пароль",
  confirmLabel = "Подтверждение пароля",
}: PasswordFieldsGroupProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const showConfirm = !passwordVisible

  useEffect(() => {
    if (passwordVisible && passwordConfirm !== password) {
      onPasswordConfirmChange(password)
    }
  }, [passwordVisible, password, passwordConfirm, onPasswordConfirmChange])

  const showRequirements = required || password.length > 0 || passwordConfirm.length > 0

  const requirementsMet = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((req) => ({
        ...req,
        met: req.test(password),
      })),
    [password]
  )

  function handleGenerate() {
    const generated = generateSecurePassword()
    onPasswordChange(generated)
    onPasswordConfirmChange(generated)
  }

  async function handleCopy() {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      notify.success("Пароль скопирован")
    } catch {
      notify.error("Не удалось скопировать пароль")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldDescription className="m-0">
          {required
            ? "Задайте пароль для входа в админ-панель"
            : "Оставьте пустым, чтобы не менять пароль"}
        </FieldDescription>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopy()}
            disabled={!password}
          >
            <Copy data-icon="inline-start" />
            Копировать
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
            <RefreshCw data-icon="inline-start" />
            Сгенерировать
          </Button>
        </div>
      </div>

      <PasswordInputField
        id="user-password"
        label={passwordLabel}
        value={password}
        onChange={onPasswordChange}
        required={required}
        visible={passwordVisible}
        onVisibleChange={setPasswordVisible}
      />

      {showConfirm && (
        <PasswordInputField
          id="user-password-confirm"
          label={confirmLabel}
          value={passwordConfirm}
          onChange={onPasswordConfirmChange}
          required={required}
        />
      )}

      {showRequirements && (
        <Field>
          <FieldDescription>Требования к паролю:</FieldDescription>
          <ul className="mt-1 space-y-1 text-sm">
            {requirementsMet.map((req) => (
              <li
                key={req.id}
                className={cn(
                  "flex items-center gap-2",
                  req.met ? "text-muted-foreground" : "text-foreground"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-xs",
                    req.met
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {req.met ? "✓" : "·"}
                </span>
                {req.label}
              </li>
            ))}
          </ul>
          {showConfirm && passwordConfirm.length > 0 && password !== passwordConfirm && (
            <FieldDescription className="text-destructive">
              Пароли не совпадают
            </FieldDescription>
          )}
        </Field>
      )}

      {showTemporary && onMustChangePasswordChange && (
        <Field orientation="horizontal">
          <Checkbox
            id="user-must-change-password"
            checked={mustChangePassword}
            onCheckedChange={(checked) => onMustChangePasswordChange(checked === true)}
          />
          <FieldLabel htmlFor="user-must-change-password" className="font-normal">
            Временный пароль (требует смены при входе)
          </FieldLabel>
        </Field>
      )}
    </div>
  )
}
