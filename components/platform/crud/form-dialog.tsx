"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { FormErrorSlot } from "@/components/shared/form-error-slot"
import { cn } from "@/lib/utils"

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  onSubmit: () => void | Promise<void>
  loading?: boolean
  error?: string
  disabled?: boolean
  formKey?: string
  size?: "sm" | "default"
  children: React.ReactNode
}

function FormDialogBody({
  title,
  submitLabel,
  onSubmit,
  loading = false,
  error,
  disabled = false,
  onOpenChange,
  children,
}: Omit<FormDialogProps, "open" | "formKey" | "size">) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <FieldGroup className="gap-3">
        {children}
        <FormErrorSlot error={error} />
      </FieldGroup>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={() => void onSubmit()} disabled={disabled || loading}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  )
}

export function FormDialog({
  open,
  onOpenChange,
  formKey = "form",
  size = "default",
  ...props
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-3 p-4",
          size === "sm" && "sm:max-w-sm",
          size === "default" && "sm:max-w-md"
        )}
      >
        {open && (
          <FormDialogBody
            key={formKey}
            onOpenChange={onOpenChange}
            {...props}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
