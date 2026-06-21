import { vi } from "vitest"

type MockFn = ReturnType<typeof vi.fn>

export type MockPrisma = {
  organization: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
    count: MockFn
  }
  subdivision: {
    findFirst: MockFn
    findMany: MockFn
    findUnique: MockFn
    findUniqueOrThrow: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
  }
  order: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
    count: MockFn
  }
  orderItem: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    findUniqueOrThrow: MockFn
    update: MockFn
    delete: MockFn
    count: MockFn
  }
  measure: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
    count: MockFn
  }
  contactPerson: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
  }
  measureImport: {
    findMany: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
  }
  measureImportItem: {
    findMany: MockFn
    create: MockFn
    update: MockFn
    deleteMany: MockFn
    createMany: MockFn
    aggregate: MockFn
  }
  user: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    delete: MockFn
    count: MockFn
  }
  appSettings: {
    findUnique: MockFn
    findUniqueOrThrow: MockFn
    upsert: MockFn
    update: MockFn
  }
  delayRequest: {
    findMany: MockFn
    findUnique: MockFn
    update: MockFn
    count: MockFn
  }
  response: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    findUniqueOrThrow: MockFn
    create: MockFn
    update: MockFn
    count: MockFn
  }
  responseAttachment: {
    findMany: MockFn
    findUnique: MockFn
    count: MockFn
    create: MockFn
    updateMany: MockFn
  }
  reportLink: {
    findMany: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    updateMany: MockFn
  }
  accessLink: {
    findMany: MockFn
    findFirst: MockFn
    findUnique: MockFn
    create: MockFn
    update: MockFn
    updateMany: MockFn
  }
  emailDelivery: {
    findUnique: MockFn
    create: MockFn
    update: MockFn
  }
  status: {
    findMany: MockFn
    findFirst: MockFn
  }
  $transaction: MockFn
}

function delegate() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    findUniqueOrThrow: vi.fn().mockImplementation(async (args: { where: { id: number } }) => ({
      id: args.where.id,
    })),
    create: vi.fn().mockImplementation(async (args: { data: unknown }) => ({
      id: 1,
      ...(args.data as object),
    })),
    update: vi.fn().mockImplementation(async (args: { data: unknown }) => ({
      id: 1,
      ...(args.data as object),
    })),
    delete: vi.fn().mockResolvedValue({ id: 1 }),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: null } }),
  }
}

export function createMockPrisma(
  overrides: Partial<Record<keyof MockPrisma, Partial<MockPrisma[keyof MockPrisma]>>> = {}
): MockPrisma {
  const base = {
    organization: delegate(),
    subdivision: delegate(),
    order: delegate(),
    orderItem: delegate(),
    measure: delegate(),
    contactPerson: delegate(),
    measureImport: delegate(),
    measureImportItem: delegate(),
    user: delegate(),
    appSettings: delegate(),
    delayRequest: delegate(),
    response: delegate(),
    responseAttachment: delegate(),
    reportLink: delegate(),
    accessLink: delegate(),
    emailDelivery: delegate(),
    status: delegate(),
    $transaction: vi.fn(async (cb: (tx: MockPrisma) => unknown) => cb(base as MockPrisma)),
  } as MockPrisma

  for (const [key, patch] of Object.entries(overrides)) {
    const delegateKey = key as keyof MockPrisma
    if (delegateKey === "$transaction") continue
    Object.assign(base[delegateKey], patch)
  }

  if (overrides.$transaction) {
    Object.assign(base.$transaction, overrides.$transaction)
  }

  return base
}
