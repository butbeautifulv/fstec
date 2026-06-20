import { randomBytes } from "crypto"

export const MIN_PASSWORD_LENGTH = 16

export type PasswordRequirement = {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: `Минимум ${MIN_PASSWORD_LENGTH} символов`,
    test: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "uppercase",
    label: "Заглавная буква",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Строчная буква",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "digit",
    label: "Цифра",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Спецсимвол (!@#$%^&* и т.п.)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export function validatePassword(password: string): {
  valid: boolean
  unmet: string[]
} {
  const unmet = PASSWORD_REQUIREMENTS.filter((req) => !req.test(password)).map(
    (req) => req.label
  )
  return { valid: unmet.length === 0, unmet }
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const LOWER = "abcdefghjkmnpqrstuvwxyz"
const DIGITS = "23456789"
const SPECIAL = "!@#$%^&*-_+=?"
const ALL = UPPER + LOWER + DIGITS + SPECIAL

export function generateSecurePassword(length = MIN_PASSWORD_LENGTH): string {
  const chars: string[] = [
    UPPER[randomBytes(1)[0]! % UPPER.length],
    LOWER[randomBytes(1)[0]! % LOWER.length],
    DIGITS[randomBytes(1)[0]! % DIGITS.length],
    SPECIAL[randomBytes(1)[0]! % SPECIAL.length],
  ]

  for (let i = chars.length; i < length; i++) {
    chars.push(ALL[randomBytes(1)[0]! % ALL.length])
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0]! % (i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }

  return chars.join("")
}
