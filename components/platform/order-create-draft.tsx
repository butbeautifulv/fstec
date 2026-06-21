"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"

export type OrderCreateMeasure = {
  id: number
  name: string
  code: string | null
  createdAt: string
}

export type OrderCreateDraft = {
  title: string
  organizationId: string
  defaultDue: string
  bulkSubdivisionId: string
  selectedMeasureIds: number[]
  measuresCache: OrderCreateMeasure[]
  sourceImportId: number | null
}

const STORAGE_KEY = "fstec:order-create-draft"

export const EMPTY_DRAFT: OrderCreateDraft = {
  title: "",
  organizationId: "",
  defaultDue: "",
  bulkSubdivisionId: "none",
  selectedMeasureIds: [],
  measuresCache: [],
  sourceImportId: null,
}

function parseDraft(raw: string | null): OrderCreateDraft {
  if (!raw) return EMPTY_DRAFT
  try {
    const parsed = JSON.parse(raw) as Partial<OrderCreateDraft>
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      selectedMeasureIds: Array.isArray(parsed.selectedMeasureIds)
        ? parsed.selectedMeasureIds
        : [],
      measuresCache: Array.isArray(parsed.measuresCache) ? parsed.measuresCache : [],
      sourceImportId:
        typeof parsed.sourceImportId === "number" ? parsed.sourceImportId : null,
    }
  } catch {
    return EMPTY_DRAFT
  }
}

function readDraftFromStorage(): OrderCreateDraft {
  if (typeof window === "undefined") return EMPTY_DRAFT
  return parseDraft(sessionStorage.getItem(STORAGE_KEY))
}

function writeDraftToStorage(draft: OrderCreateDraft) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota / private mode
  }
}

type DraftStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => OrderCreateDraft
  getServerSnapshot: () => OrderCreateDraft
  update: (patch: Partial<OrderCreateDraft>) => void
  setSelectedMeasureIds: (ids: number[]) => void
  setMeasuresCache: (measures: OrderCreateMeasure[]) => void
  clear: () => void
}

function createDraftStore(): DraftStore {
  let draft = readDraftFromStorage()
  let persistTimer: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<() => void>()

  function emit() {
    listeners.forEach((listener) => listener())
  }

  function schedulePersist(next: OrderCreateDraft) {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => writeDraftToStorage(next), 300)
  }

  function commit(next: OrderCreateDraft) {
    draft = next
    schedulePersist(next)
    emit()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      return draft
    },
    getServerSnapshot() {
      return EMPTY_DRAFT
    },
    update(patch) {
      commit({ ...draft, ...patch })
    },
    setSelectedMeasureIds(ids) {
      commit({ ...draft, selectedMeasureIds: ids })
    },
    setMeasuresCache(measures) {
      commit({ ...draft, measuresCache: measures })
    },
    clear() {
      if (persistTimer) clearTimeout(persistTimer)
      draft = EMPTY_DRAFT
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      }
      emit()
    },
  }
}

let draftStore: DraftStore | null = null

function getDraftStore() {
  if (!draftStore) draftStore = createDraftStore()
  return draftStore
}

type OrderCreateDraftContextValue = {
  draft: OrderCreateDraft
  hydrated: boolean
  updateDraft: (patch: Partial<OrderCreateDraft>) => void
  setSelectedMeasureIds: (ids: number[]) => void
  setMeasuresCache: (measures: OrderCreateMeasure[]) => void
  clearDraft: () => void
  selectedIds: Set<number>
}

const OrderCreateDraftContext = createContext<OrderCreateDraftContextValue | null>(null)

export function OrderCreateDraftProvider({ children }: { children: ReactNode }) {
  const store = getDraftStore()
  const draft = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const updateDraft = useCallback((patch: Partial<OrderCreateDraft>) => {
    store.update(patch)
  }, [store])

  const setSelectedMeasureIds = useCallback((ids: number[]) => {
    store.setSelectedMeasureIds(ids)
  }, [store])

  const setMeasuresCache = useCallback((measures: OrderCreateMeasure[]) => {
    store.setMeasuresCache(measures)
  }, [store])

  const clearDraft = useCallback(() => {
    store.clear()
  }, [store])

  const selectedIds = useMemo(
    () => new Set(draft.selectedMeasureIds),
    [draft.selectedMeasureIds]
  )

  const value = useMemo(
    () => ({
      draft,
      hydrated,
      updateDraft,
      setSelectedMeasureIds,
      setMeasuresCache,
      clearDraft,
      selectedIds,
    }),
    [
      draft,
      hydrated,
      updateDraft,
      setSelectedMeasureIds,
      setMeasuresCache,
      clearDraft,
      selectedIds,
    ]
  )

  return (
    <OrderCreateDraftContext.Provider value={value}>
      {children}
    </OrderCreateDraftContext.Provider>
  )
}

export function useOrderCreateDraft() {
  const ctx = useContext(OrderCreateDraftContext)
  if (!ctx) {
    throw new Error("useOrderCreateDraft must be used within OrderCreateDraftProvider")
  }
  return ctx
}
