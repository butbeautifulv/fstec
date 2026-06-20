"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTableShell } from "@/components/platform/data-table-shell"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react"

type LinkRow = {
  id: number
  token: string
  revokedAt: string | null
  subdivisionId: number | null
  subdivision: { id: number; name: string } | null
}

type Subdivision = { id: number; name: string }

function getActiveForSubdivision(links: LinkRow[], subdivisionId: number | null) {
  return links.find((l) => {
    if (l.revokedAt) return false
    if (subdivisionId === null) {
      return l.subdivisionId === null && l.subdivision === null
    }
    return l.subdivisionId === subdivisionId || l.subdivision?.id === subdivisionId
  })
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    const url = `${window.location.origin}/p/${token}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify.success("Ссылка скопирована")
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon-sm" variant="outline" onClick={copyUrl}>
          {copied ? <Check /> : <Copy />}
          <span className="sr-only">Копировать ссылку</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Скопировано" : "Копировать ссылку"}</TooltipContent>
    </Tooltip>
  )
}

export function OrgLinksPanel({
  organizationId,
  initialSubdivisions,
  initialLinks,
}: {
  organizationId: number
  initialSubdivisions: Subdivision[]
  initialLinks: LinkRow[]
}) {
  const router = useRouter()
  const [subdivisions, setSubdivisions] = useState(initialSubdivisions)
  const [links, setLinks] = useState(initialLinks)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function generateOrgLink() {
    const res = await fetch(`/api/organizations/${organizationId}/links`, {
      method: "POST",
    })
    if (res.ok) {
      const link = await res.json()
      setLinks((prev) => [link, ...prev])
      notify.success(`Ссылка ${labels.orgGenitive} создана`)
    }
  }

  async function generateSubLink(subdivisionId: number) {
    const res = await fetch(`/api/subdivisions/${subdivisionId}/links`, {
      method: "POST",
    })
    if (res.ok) {
      const link = await res.json()
      setLinks((prev) => [link, ...prev])
      notify.success("Ссылка подразделения создана")
    }
  }

  async function revoke(linkId: number) {
    const link = links.find((l) => l.id === linkId)
    const url = link?.subdivision
      ? `/api/subdivisions/${link.subdivision.id}/links?linkId=${linkId}`
      : `/api/organizations/${organizationId}/links?linkId=${linkId}`
    await fetch(url, { method: "DELETE" })
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId ? { ...l, revokedAt: new Date().toISOString() } : l
      )
    )
    notify.success("Ссылка отозвана")
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/subdivisions/${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setSubdivisions((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
      router.refresh()
      notify.success("Подразделение удалено")
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось удалить подразделение")
    }
  }

  const orgLink = getActiveForSubdivision(links, null)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border p-4">
        <h2 className="mb-3 font-medium">Ссылка {labels.orgGenitive} (все меры организации)</h2>
        {orgLink ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
              /p/{orgLink.token.slice(0, 16)}…
            </code>
            <CopyLinkButton token={orgLink.token} />
            <Button size="sm" variant="outline" onClick={() => revoke(orgLink.id)}>
              Отозвать
            </Button>
            <Button size="sm" variant="outline" onClick={generateOrgLink}>
              Новая ссылка
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={generateOrgLink}>
            Сгенерировать ссылку
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href={`/panel/organizations/${organizationId}/subdivisions/new`}>
              <Plus data-icon="inline-start" />
              Добавить подразделение
            </Link>
          </Button>
        </div>

        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Ссылка</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdivisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <EmptyTableState
                      title="Нет подразделений"
                      description="Добавьте подразделения для разграничения доступа и генерации ссылок"
                    >
                      <Button size="sm" asChild>
                        <Link
                          href={`/panel/organizations/${organizationId}/subdivisions/new`}
                        >
                          <Plus data-icon="inline-start" />
                          Добавить подразделение
                        </Link>
                      </Button>
                    </EmptyTableState>
                  </TableCell>
                </TableRow>
              ) : (
                subdivisions.map((sub) => {
                  const subLink = getActiveForSubdivision(links, sub.id)
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Link
                          href={`/panel/organizations/${organizationId}/subdivisions/${sub.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {sub.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {subLink ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="font-mono text-xs">
                              /p/{subLink.token.slice(0, 12)}…
                            </code>
                            <CopyLinkButton token={subLink.token} />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revoke(subLink.id)}
                            >
                              Отозвать
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => generateSubLink(sub.id)}>
                            Создать
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <TableRowActions
                          actions={[
                            {
                              label: "Изменить",
                              icon: <Pencil data-icon="inline-start" />,
                              href: `/panel/organizations/${organizationId}/subdivisions/${sub.id}/edit`,
                            },
                            {
                              label: "Удалить",
                              icon: <Trash2 data-icon="inline-start" />,
                              destructive: true,
                              onClick: () => setDeleteId(sub.id),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </DataTableShell>
      </div>

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить подразделение?"
        description={`Подразделение будет удалено из ${labels.orgGenitive}.`}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
