import { vi } from "vitest"

export function createMockRedis() {
  const store = new Map<string, { value: number; expiresAt: number | null }>()

  return {
    incr: vi.fn(async (key: string) => {
      const entry = store.get(key)
      const next = (entry?.value ?? 0) + 1
      store.set(key, { value: next, expiresAt: entry?.expiresAt ?? null })
      return next
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      const entry = store.get(key)
      if (!entry) return 0
      store.set(key, {
        ...entry,
        expiresAt: Date.now() + seconds * 1000,
      })
      return 1
    }),
    get: vi.fn(async (key: string) => {
      const entry = store.get(key)
      return entry?.value != null ? String(entry.value) : null
    }),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, { value: Number(value), expiresAt: null })
      return "OK"
    }),
    setex: vi.fn(async (key: string, _seconds: number, value: string) => {
      store.set(key, { value: Number(value), expiresAt: null })
      return "OK"
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key)
      return 1
    }),
    _store: store,
  }
}
