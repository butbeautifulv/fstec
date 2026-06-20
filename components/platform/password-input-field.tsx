"use client"

import { useState, type CSSProperties } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

type PasswordInputFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
}

export function PasswordInputField({
  id,
  label,
  value,
  onChange,
  required,
  autoComplete = "new-password",
  visible: visibleProp,
  onVisibleChange,
}: PasswordInputFieldProps) {
  const [internalVisible, setInternalVisible] = useState(false)
  const visible = visibleProp ?? internalVisible

  function setVisible(next: boolean) {
    onVisibleChange?.(next)
    if (visibleProp === undefined) setInternalVisible(next)
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className={cn(!visible && "[-webkit-text-security:disc]")}
          style={
            !visible
              ? ({ WebkitTextSecurity: "disc" } as CSSProperties)
              : undefined
          }
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={visible}
            className="active:translate-y-0"
            onClick={() => setVisible(!visible)}
          >
            <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
              <Eye className={cn("size-4", visible && "hidden")} aria-hidden />
              <EyeOff
                className={cn("absolute size-4", !visible && "hidden")}
                aria-hidden
              />
            </span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
