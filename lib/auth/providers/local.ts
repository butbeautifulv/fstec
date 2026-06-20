import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import type { AuthCredentials, AuthProvider, AuthResult, AuthProviderStatus } from "./types"

export const localAuthProvider: AuthProvider = {
  id: "local",
  label: "Локальная",

  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    })

    if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
      return { ok: false, error: "Invalid email or password", status: 401 }
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    }
  },

  getStatus(): AuthProviderStatus {
    return {
      id: "local",
      label: "Локальная",
      configured: true,
      message: "Аутентификация по email и паролю из базы данных",
      requiredEnv: [],
    }
  },
}
