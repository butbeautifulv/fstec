"use client"

import { PasswordInputField } from "@/components/platform/password-input-field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmDeleteAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  requirePassword?: boolean
  password?: string
  onPasswordChange?: (value: string) => void
  passwordLabel?: string
}

export function ConfirmDeleteAlert({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
  requirePassword = false,
  password = "",
  onPasswordChange,
  passwordLabel = "Ваш пароль",
}: ConfirmDeleteAlertProps) {
  const canConfirm = !requirePassword || password.length > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requirePassword && onPasswordChange && (
          <PasswordInputField
            id="confirm-delete-password"
            label={passwordLabel}
            value={password}
            onChange={onPasswordChange}
            required
            autoComplete="current-password"
          />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={loading || !canConfirm}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
