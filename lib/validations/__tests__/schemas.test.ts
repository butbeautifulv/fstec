import { describe, expect, it } from "vitest"
import { updateAccountSchema } from "@/lib/validations/account"
import {
  changePasswordSchema,
  loginSchema,
} from "@/lib/validations/auth"
import {
  createContactSchema,
  updateContactSchema,
} from "@/lib/validations/contacts"
import { measureSchema } from "@/lib/validations/measures"
import { updateMeasureImportItemsSchema } from "@/lib/validations/measure-imports"
import {
  organizationSchema,
  subdivisionSchema,
  subdivisionUpdateSchema,
} from "@/lib/validations/organizations"
import {
  batchCreateOrdersSchema,
  createOrderSchema,
} from "@/lib/validations/orders"
import {
  attachmentPresignSchema,
  delayRequestSchema,
  responseSchema,
  statusActionSchema,
} from "@/lib/validations/public"
import { updateSettingsSchema } from "@/lib/validations/settings"
import {
  createUserSchema,
  deleteUserConfirmSchema,
  updateUserSchema,
} from "@/lib/validations/users"

const VALID_PASSWORD = "Str0ng!Passw0rdLong"

describe("createContactSchema", () => {
  it("accepts valid contact", () => {
    const result = createContactSchema.safeParse({
      fullName: "Иван Иванов",
      email: "ivan@example.com",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe("RESPONSIBLE")
    }
  })

  it("rejects invalid email", () => {
    expect(
      createContactSchema.safeParse({
        fullName: "Test",
        email: "not-an-email",
      }).success
    ).toBe(false)
  })
})

describe("updateContactSchema", () => {
  it("allows partial updates", () => {
    const result = updateContactSchema.safeParse({ isActive: false })
    expect(result.success).toBe(true)
  })
})

describe("batchCreateOrdersSchema", () => {
  const valid = {
    title: "Batch order",
    defaultDueAt: "2026-12-31T00:00:00.000Z",
    measureIds: [1],
    targets: [{ organizationId: 1 }],
  }

  it("accepts valid batch payload", () => {
    expect(batchCreateOrdersSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects empty targets", () => {
    expect(
      batchCreateOrdersSchema.safeParse({ ...valid, targets: [] }).success
    ).toBe(false)
  })

  it("rejects empty measureIds", () => {
    expect(
      batchCreateOrdersSchema.safeParse({ ...valid, measureIds: [] }).success
    ).toBe(false)
  })

  it("rejects invalid measure id", () => {
    expect(
      batchCreateOrdersSchema.safeParse({ ...valid, measureIds: [0] }).success
    ).toBe(false)
  })
})

describe("createOrderSchema", () => {
  it("requires at least one item", () => {
    expect(
      createOrderSchema.safeParse({
        title: "Order",
        organizationId: 1,
        items: [],
      }).success
    ).toBe(false)
  })
})

describe("updateMeasureImportItemsSchema", () => {
  it("requires non-empty items array", () => {
    expect(updateMeasureImportItemsSchema.safeParse({ items: [] }).success).toBe(
      false
    )
  })

  it("accepts item patch", () => {
    expect(
      updateMeasureImportItemsSchema.safeParse({
        items: [{ id: 1, included: false }],
      }).success
    ).toBe(true)
  })
})

describe("updateAccountSchema", () => {
  it("accepts profile update without password change", () => {
    expect(
      updateAccountSchema.safeParse({
        name: "Иван",
        email: "ivan@example.com",
        locale: "ru",
      }).success
    ).toBe(true)
  })

  it("rejects invalid email", () => {
    expect(
      updateAccountSchema.safeParse({
        name: "Test",
        email: "bad",
      }).success
    ).toBe(false)
  })

  it("requires current password when changing password", () => {
    const result = updateAccountSchema.safeParse({
      name: "Test",
      email: "test@example.com",
      password: VALID_PASSWORD,
      passwordConfirm: VALID_PASSWORD,
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid password change", () => {
    expect(
      updateAccountSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        currentPassword: "OldPass!123456789",
        password: VALID_PASSWORD,
        passwordConfirm: VALID_PASSWORD,
      }).success
    ).toBe(true)
  })

  it("rejects mismatched password confirmation", () => {
    const result = updateAccountSchema.safeParse({
      name: "Test",
      email: "test@example.com",
      currentPassword: "OldPass!123456789",
      password: VALID_PASSWORD,
      passwordConfirm: "Different!Passw0rd",
    })
    expect(result.success).toBe(false)
  })

  it("rejects password without confirm", () => {
    const result = updateAccountSchema.safeParse({
      name: "Test",
      email: "test@example.com",
      currentPassword: "OldPass!123456789",
      password: VALID_PASSWORD,
    })
    expect(result.success).toBe(false)
  })

  it("rejects weak password", () => {
    const result = updateAccountSchema.safeParse({
      name: "Test",
      email: "test@example.com",
      currentPassword: "OldPass!123456789",
      password: "weak",
      passwordConfirm: "weak",
    })
    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "secret",
      }).success
    ).toBe(true)
  })

  it("rejects empty password", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      }).success
    ).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("accepts valid password change", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass!123456789",
        newPassword: VALID_PASSWORD,
        passwordConfirm: VALID_PASSWORD,
      }).success
    ).toBe(true)
  })

  it("rejects mismatched confirmation", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass!123456789",
        newPassword: VALID_PASSWORD,
        passwordConfirm: "Other!Passw0rd123",
      }).success
    ).toBe(false)
  })

  it("rejects weak new password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass!123456789",
        newPassword: "short",
        passwordConfirm: "short",
      }).success
    ).toBe(false)
  })

  it("rejects weak new password with policy message", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass!123456789",
      newPassword: "weak",
      passwordConfirm: "weak",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBeTruthy()
    }
  })
})

describe("measureSchema", () => {
  it("accepts valid measure", () => {
    expect(
      measureSchema.safeParse({
        name: "Measure name",
        description: "Details",
        code: "M-1",
      }).success
    ).toBe(true)
  })

  it("rejects empty name", () => {
    expect(measureSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("rejects overly long name", () => {
    expect(measureSchema.safeParse({ name: "x".repeat(501) }).success).toBe(
      false
    )
  })
})

describe("organizationSchema", () => {
  it("accepts valid organization", () => {
    expect(
      organizationSchema.safeParse({
        name: "Org",
        shortCode: "ORG",
      }).success
    ).toBe(true)
  })

  it("rejects empty name", () => {
    expect(organizationSchema.safeParse({ name: "" }).success).toBe(false)
  })
})

describe("subdivisionSchema", () => {
  it("accepts valid subdivision", () => {
    expect(
      subdivisionSchema.safeParse({
        organizationId: 1,
        name: "Dept",
      }).success
    ).toBe(true)
  })

  it("rejects non-positive organizationId", () => {
    expect(
      subdivisionSchema.safeParse({
        organizationId: 0,
        name: "Dept",
      }).success
    ).toBe(false)
  })
})

describe("subdivisionUpdateSchema", () => {
  it("accepts name update", () => {
    expect(subdivisionUpdateSchema.safeParse({ name: "New name" }).success).toBe(
      true
    )
  })
})

describe("responseSchema", () => {
  it("accepts valid response", () => {
    expect(
      responseSchema.safeParse({
        result: "Completed",
        commentary: "Notes",
        attachmentIds: [1, 2],
      }).success
    ).toBe(true)
  })

  it("rejects empty result", () => {
    expect(responseSchema.safeParse({ result: "" }).success).toBe(false)
  })
})

describe("attachmentPresignSchema", () => {
  it("accepts allowed image upload", () => {
    expect(
      attachmentPresignSchema.safeParse({
        originalName: "photo.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      }).success
    ).toBe(true)
  })

  it("rejects unsupported mime type", () => {
    expect(
      attachmentPresignSchema.safeParse({
        originalName: "doc.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }).success
    ).toBe(false)
  })
})

describe("delayRequestSchema", () => {
  it("coerces requestedDueAt to date", () => {
    const result = delayRequestSchema.safeParse({
      requestedDueAt: "2026-12-31",
      justification: "Need more time",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.requestedDueAt).toBeInstanceOf(Date)
    }
  })
})

describe("statusActionSchema", () => {
  it("accepts start action", () => {
    expect(statusActionSchema.safeParse({ action: "start" }).success).toBe(true)
  })

  it("rejects unknown action", () => {
    expect(statusActionSchema.safeParse({ action: "stop" }).success).toBe(false)
  })
})

describe("updateSettingsSchema", () => {
  it("accepts partial settings update", () => {
    expect(
      updateSettingsSchema.safeParse({
        timezone: "Europe/Moscow",
        locale: "ru",
        headOrganizationId: null,
      }).success
    ).toBe(true)
  })

  it("rejects invalid timezone", () => {
    expect(
      updateSettingsSchema.safeParse({ timezone: "Invalid/Zone" }).success
    ).toBe(false)
  })
})

describe("createUserSchema", () => {
  it("accepts valid user", () => {
    expect(
      createUserSchema.safeParse({
        email: "new@example.com",
        name: "New User",
        password: VALID_PASSWORD,
        passwordConfirm: VALID_PASSWORD,
        role: "OPERATOR",
      }).success
    ).toBe(true)
  })

  it("rejects weak password", () => {
    expect(
      createUserSchema.safeParse({
        email: "new@example.com",
        name: "New User",
        password: "short",
        passwordConfirm: "short",
        role: "OPERATOR",
      }).success
    ).toBe(false)
  })

  it("rejects password mismatch", () => {
    expect(
      createUserSchema.safeParse({
        email: "new@example.com",
        name: "New User",
        password: VALID_PASSWORD,
        passwordConfirm: "Other!Passw0rd123",
        role: "OPERATOR",
      }).success
    ).toBe(false)
  })
})

describe("updateUserSchema", () => {
  it("accepts update without password", () => {
    expect(
      updateUserSchema.safeParse({
        email: "user@example.com",
        name: "User",
        role: "VIEWER",
      }).success
    ).toBe(true)
  })

  it("requires matching password fields when password is set", () => {
    expect(
      updateUserSchema.safeParse({
        email: "user@example.com",
        name: "User",
        role: "VIEWER",
        password: VALID_PASSWORD,
      }).success
    ).toBe(false)
  })

  it("rejects weak password when changing password", () => {
    expect(
      updateUserSchema.safeParse({
        email: "user@example.com",
        name: "User",
        role: "VIEWER",
        password: "weak",
        passwordConfirm: "weak",
      }).success
    ).toBe(false)
  })

  it("rejects mismatched password confirmation", () => {
    expect(
      updateUserSchema.safeParse({
        email: "user@example.com",
        name: "User",
        role: "VIEWER",
        password: VALID_PASSWORD,
        passwordConfirm: "Other!Passw0rd123",
      }).success
    ).toBe(false)
  })

  it("accepts valid password change", () => {
    expect(
      updateUserSchema.safeParse({
        email: "user@example.com",
        name: "User",
        role: "VIEWER",
        password: VALID_PASSWORD,
        passwordConfirm: VALID_PASSWORD,
      }).success
    ).toBe(true)
  })
})

describe("deleteUserConfirmSchema", () => {
  it("requires confirmation password", () => {
    expect(deleteUserConfirmSchema.safeParse({ password: "" }).success).toBe(
      false
    )
    expect(
      deleteUserConfirmSchema.safeParse({ password: "confirm-me" }).success
    ).toBe(true)
  })
})
