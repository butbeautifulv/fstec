import nodemailer from "nodemailer"
import type { EmailDeliveryStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getSmtpConfig, isSmtpConfigured } from "@/lib/email/config"

export type SendEmailInput = {
  to: string
  subject: string
  text: string
  html: string
  template?: string
  relatedType?: string
  relatedId?: number
  dedupeKey?: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!isSmtpConfigured()) return null
  if (!transporter) {
    const config = getSmtpConfig()
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth:
        config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
    })
  }
  return transporter
}

export async function sendEmail(input: SendEmailInput) {
  if (input.dedupeKey) {
    const existing = await prisma.emailDelivery.findUnique({
      where: { dedupeKey: input.dedupeKey },
    })
    if (existing?.status === "SENT") {
      return existing
    }
  }

  const delivery = await prisma.emailDelivery.create({
    data: {
      to: input.to,
      subject: input.subject,
      template: input.template ?? null,
      status: "PENDING",
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      dedupeKey: input.dedupeKey ?? null,
    },
  })

  const transport = getTransporter()
  const from = getSmtpConfig().from

  if (!transport) {
    console.info("[email:log-only]", {
      to: input.to,
      subject: input.subject,
      template: input.template,
    })
    return prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        error: "log-only",
      },
    })
  }

  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })

    return prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT" satisfies EmailDeliveryStatus,
        sentAt: new Date(),
        error: null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEND_FAILED"
    return prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        error: message,
      },
    })
  }
}
