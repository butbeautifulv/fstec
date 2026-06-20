import { z } from "zod"
import { validatePassword } from "@/lib/auth/password-policy"
import { LOCALE_IDS } from "@/lib/i18n/locales"

export const updateAccountSchema = z
  .object({
    name: z.string().min(1, "Имя обязательно"),
    email: z.email("Некорректный email"),
    locale: z.enum(LOCALE_IDS).nullable().optional(),
    currentPassword: z.string().optional(),
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasPassword = Boolean(data.password?.length)
    const hasConfirm = Boolean(data.passwordConfirm?.length)

    if (hasPassword !== hasConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Подтвердите пароль",
        path: ["passwordConfirm"],
      })
      return
    }

    if (!hasPassword) return

    if (!data.currentPassword?.length) {
      ctx.addIssue({
        code: "custom",
        message: "Введите текущий пароль",
        path: ["currentPassword"],
      })
    }

    const { valid, unmet } = validatePassword(data.password!)
    if (!valid) {
      ctx.addIssue({
        code: "custom",
        message: unmet[0] ?? "Пароль не соответствует требованиям",
        path: ["password"],
      })
    }

    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Пароли не совпадают",
        path: ["passwordConfirm"],
      })
    }
  })

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
