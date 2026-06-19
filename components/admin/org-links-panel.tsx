"use client"

import Link from "next/link"
import { useState } from "react"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
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
import { Copy, Check } from "lucide-react"

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
  organizationName,
  subdivisions,
  initialLinks,
  embedded = false,
}: {
  organizationId: number
  organizationName: string
  subdivisions: Subdivision[]
  initialLinks: LinkRow[]
  embedded?: boolean
}) {
  const [links, setLinks] = useState(initialLinks)

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

  const orgLink = getActiveForSubdivision(links, null)

  return (
    <div className="flex flex-col gap-8">
      {!embedded && (
        <div>
          <Link href="/admin/organizations" className="text-sm text-muted-foreground hover:underline">
            ← {labels.orgs}
          </Link>
          <h1 className="mt-2 text-xl font-medium">{organizationName}</h1>
          <p className="text-sm text-muted-foreground">Ссылки для исполнителей</p>
        </div>
      )}

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

      <div>
        <h2 className="mb-3 font-medium">Ссылки подразделений</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Подразделение</TableHead>
                <TableHead>Ссылка</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdivisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <EmptyTableState
                      title="Нет подразделений"
                      description="Создайте подразделения для генерации ссылок"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                subdivisions.map((sub) => {
                  const subLink = getActiveForSubdivision(links, sub.id)
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.name}</TableCell>
                      <TableCell>
                        {subLink ? (
                          <code className="font-mono text-xs">/p/{subLink.token.slice(0, 12)}…</code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {subLink ? (
                          <div className="flex justify-end gap-2">
                            <CopyLinkButton token={subLink.token} />
                            <Button size="sm" variant="outline" onClick={() => revoke(subLink.id)}>
                              Отозвать
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => generateSubLink(sub.id)}>
                            Создать
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
