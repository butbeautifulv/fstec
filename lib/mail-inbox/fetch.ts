import { ImapFlow } from "imapflow"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getAppBaseUrl, getOperatorNotifyEmail } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { importFromInboxTemplate } from "@/lib/email/templates"
import { processInboxAttachments } from "@/lib/mail-inbox/process-attachments"
import { isDocxFilename } from "@/lib/regulatory-docs/config"

type AttachmentPart = {
  part: string
  filename: string
  type: string
}

function getImapConfig() {
  return {
    host: process.env.INBOX_IMAP_HOST?.trim(),
    port: Number(process.env.INBOX_IMAP_PORT ?? 993),
    user: process.env.INBOX_IMAP_USER?.trim(),
    pass: process.env.INBOX_IMAP_PASS?.trim(),
    secure: process.env.INBOX_IMAP_SECURE !== "false",
  }
}

export function isImapConfigured() {
  const config = getImapConfig()
  return Boolean(config.host && config.user && config.pass)
}

async function getSystemUploaderId() {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    orderBy: { id: "asc" },
    select: { id: true },
  })
  if (!admin) throw new Error("NOT_FOUND")
  return admin.id
}

function collectDocxParts(node: unknown, parts: AttachmentPart[], partId = ""): void {
  if (!node || typeof node !== "object") return
  const entry = node as {
    part?: string
    type?: string
    disposition?: string
    dispositionParameters?: { filename?: string }
    parameters?: { name?: string }
    childNodes?: unknown[]
  }

  const filename = entry.dispositionParameters?.filename ?? entry.parameters?.name
  const currentPart = entry.part ?? partId

  if (entry.disposition === "attachment" && filename && isDocxFilename(filename)) {
    parts.push({
      part: currentPart,
      filename,
      type: entry.type ?? "application/octet-stream",
    })
  }

  if (Array.isArray(entry.childNodes)) {
    for (const child of entry.childNodes) {
      collectDocxParts(child, parts, currentPart)
    }
  }
}

async function streamToBuffer(content: AsyncIterable<Buffer> | Buffer) {
  if (Buffer.isBuffer(content)) return content
  const chunks: Buffer[] = []
  for await (const chunk of content) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function fetchInboxDocxImports() {
  if (!isImapConfigured()) {
    return { processed: 0, skipped: true as const }
  }

  const config = getImapConfig()
  const client = new ImapFlow({
    host: config.host!,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user!,
      pass: config.pass!,
    },
  })

  const uploadedById = await getSystemUploaderId()
  let processed = 0

  await client.connect()
  try {
    const lock = await client.getMailboxLock("INBOX")
    try {
      for await (const message of client.fetch({ seen: false }, { uid: true, bodyStructure: true })) {
        const parts: AttachmentPart[] = []
        collectDocxParts(message.bodyStructure, parts)

        if (parts.length === 0) {
          await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"])
          continue
        }

        const processedCount = await processInboxAttachments(
          parts,
          async (partId) => {
            const dl = await client.download(message.uid, partId, { uid: true })
            return streamToBuffer(dl.content as AsyncIterable<Buffer>)
          },
          uploadedById
        )

        if (processedCount > 0) {
          const lastPart = parts[parts.length - 1]!
          const importUrl = `${getAppBaseUrl()}/panel/measures/imports`
          const template = importFromInboxTemplate({
            documentNumber: null,
            originalName: lastPart.filename,
            measureCount: processedCount,
            importUrl,
          })

          await sendEmail({
            to: getOperatorNotifyEmail(),
            subject: template.subject,
            text: template.text,
            html: template.html,
            template: "import-from-inbox",
            relatedType: "measure_import",
            relatedId: message.uid,
            dedupeKey: `import-inbox:${message.uid}`,
          })

          processed += processedCount
        }

        await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"])
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }

  return { processed, skipped: false as const }
}
