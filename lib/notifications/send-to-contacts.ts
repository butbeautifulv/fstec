import { sendEmail } from "@/lib/email/send"

type Contact = { email: string }

type EmailTemplate = {
  subject: string
  text: string
  html: string
}

export async function sendToContacts(
  contacts: Contact[],
  buildTemplate: (contact: Contact) => EmailTemplate,
  options: {
    template: string
    relatedType: string
    relatedId: number
    dedupeKey: (contact: Contact) => string
  }
) {
  await Promise.all(
    contacts.map((contact) => {
      const template = buildTemplate(contact)
      return sendEmail({
        to: contact.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
        template: options.template,
        relatedType: options.relatedType,
        relatedId: options.relatedId,
        dedupeKey: options.dedupeKey(contact),
      })
    })
  )
}
