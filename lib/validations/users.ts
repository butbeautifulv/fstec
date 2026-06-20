import { z } from "zod"
import { UserRole } from "@prisma/client"
import { ASSIGNABLE_ROLES } from "@/lib/auth/permissions"
import { validatePassword } from "@/lib/auth/password-policy"

const roleSchema = z.enum(
  ASSIGNABLE_ROLES as [UserRole, ...UserRole[]],
  "Выберите роль"
)

const passwordSchema = z.string().superRefine((value, ctx) => {
  const { valid, unmet } = validatePassword(value)
  if (!valid) {
    ctx.addIssue({
      code: "custom",
      message: unmet[0] ?? "Пароль не соответствует требованиям",
    })
  }
})

export const createUserSchema = z
  .object({
    email: z.email("Некорректный email"),
    name: z.string().min(1, "Имя обязательно"),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Подтвердите пароль"),
    role: roleSchema,
    mustChangePassword: z.boolean().default(false),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Пароли не совпадают",
    path: ["passwordConfirm"],
  })

export const updateUserSchema = z
  .object({
    email: z.email("Некорректный email"),
    name: z.string().min(1, "Имя обязательно"),
    role: roleSchema,
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
    mustChangePassword: z.boolean().optional(),
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

export const deleteUserConfirmSchema = z.object({
  password: z.string().min(1, "Введите ваш пароль для подтверждения"),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type DeleteUserConfirmInput = z.infer<typeof deleteUserConfirmSchema>
