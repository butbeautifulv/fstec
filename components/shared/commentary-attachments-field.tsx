"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { MAX_ATTACHMENTS_PER_RESPONSE } from "@/lib/storage/config"
import { notify } from "@/lib/ui/feedback"
import { cn } from "@/lib/utils"
import { ImagePlus, Loader2, X } from "lucide-react"

type UploadedAttachment = {
  id: number
  previewUrl: string
  originalName: string
}

export type CommentaryAttachmentsValue = {
  commentary: string
  attachmentIds: number[]
}

type PresignResponse = {
  attachmentId: number
  uploadUrl: string
}

async function uploadFile(presignUrl: string, file: File): Promise<PresignResponse> {
  const res = await fetch(presignUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? "Не удалось подготовить загрузку")
  }
  const data = (await res.json()) as PresignResponse

  const putRes = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!putRes.ok) {
    throw new Error("Не удалось загрузить файл")
  }

  return data
}

export function CommentaryAttachmentsField({
  presignUrl,
  disabled = false,
  value,
  onChange,
}: {
  presignUrl: string
  disabled?: boolean
  value: CommentaryAttachmentsValue
  onChange: (value: CommentaryAttachmentsValue) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<UploadedAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const previewUrlsRef = useRef<string[]>([])

  const syncAttachmentIds = useCallback(
    (items: UploadedAttachment[]) => {
      onChange({
        commentary: value.commentary,
        attachmentIds: items.map((item) => item.id),
      })
    },
    [onChange, value.commentary]
  )

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  const processFiles = useCallback(
    async (files: File[]) => {
      if (disabled || files.length === 0) return

      const remaining = MAX_ATTACHMENTS_PER_RESPONSE - uploads.length
      if (remaining <= 0) {
        notify.error(`Максимум ${MAX_ATTACHMENTS_PER_RESPONSE} изображений`)
        return
      }

      const batch = files.slice(0, remaining)
      setUploading(true)

      const added: UploadedAttachment[] = []
      for (const file of batch) {
        if (!file.type.startsWith("image/")) {
          notify.error(`${file.name}: только изображения`)
          continue
        }
        try {
          const data = await uploadFile(presignUrl, file)
          const previewUrl = URL.createObjectURL(file)
          previewUrlsRef.current.push(previewUrl)
          added.push({
            id: data.attachmentId,
            previewUrl,
            originalName: file.name,
          })
        } catch (error) {
          notify.error(error instanceof Error ? error.message : "Ошибка загрузки")
        }
      }

      if (added.length > 0) {
        const next = [...uploads, ...added]
        setUploads(next)
        syncAttachmentIds(next)
      }
      setUploading(false)
    },
    [disabled, presignUrl, uploads, syncAttachmentIds]
  )

  function removeAttachment(id: number) {
    const removed = uploads.find((item) => item.id === id)
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl)
      previewUrlsRef.current = previewUrlsRef.current.filter((u) => u !== removed.previewUrl)
    }
    const next = uploads.filter((item) => item.id !== id)
    setUploads(next)
    syncAttachmentIds(next)
  }

  function handlePaste(event: React.ClipboardEvent) {
    const items = event.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          files.push(
            new File([file], file.name || `screenshot-${Date.now()}.png`, {
              type: file.type,
            })
          )
        }
      }
    }
    if (files.length > 0) {
      event.preventDefault()
      void processFiles(files)
    }
  }

  return (
    <FieldGroup className="gap-4" onPaste={handlePaste}>
      <Field>
        <FieldLabel htmlFor="commentary">Комментарий</FieldLabel>
        <Textarea
          id="commentary"
          placeholder="Дополнительные пояснения, можно вставить скриншот из буфера (Ctrl+V)"
          value={value.commentary}
          onChange={(e) =>
            onChange({ commentary: e.target.value, attachmentIds: value.attachmentIds })
          }
          rows={4}
          disabled={disabled}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Скриншоты и фото</FieldLabel>
          <span className="text-xs text-muted-foreground">
            {uploads.length}/{MAX_ATTACHMENTS_PER_RESPONSE}
          </span>
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-2",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          {uploads.map((item) => (
            <div
              key={item.id}
              className="group relative size-20 overflow-hidden rounded-md border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.originalName}
                className="size-full object-cover"
              />
              <button
                type="button"
                className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeAttachment(item.id)}
                aria-label="Удалить"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          {uploads.length < MAX_ATTACHMENTS_PER_RESPONSE && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="size-20 flex-col gap-1"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              <span className="text-xs">Прикрепить</span>
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = ""
            void processFiles(files)
          }}
        />

        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP, GIF до 5 МБ. Можно вставить скриншот из буфера обмена.
        </p>
      </div>
    </FieldGroup>
  )
}

export function useCommentaryAttachmentsState() {
  return useState<CommentaryAttachmentsValue>({
    commentary: "",
    attachmentIds: [],
  })
}
