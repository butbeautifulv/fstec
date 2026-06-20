import { z } from "zod"
import { validatePassword } from "@/lib/auth/password-policy"

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z.string().superRefine((value, ctx) => {
      const { valid, unmet } = validatePassword(value)
      if (!valid) {
        ctx.addIssue({
          code: "custom",
          message: unmet[0] ?? "Пароль не соответствует требованиям",
        })
      }
    }),
    passwordConfirm: z.string().min(1, "Подтвердите пароль"),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: "Пароли не совпадают",
    path: ["passwordConfirm"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
