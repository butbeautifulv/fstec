export function getAppBaseUrl() {
  return process.env.APP_URL ?? "http://localhost:3000"
}

export function getOperatorNotifyEmail() {
  return (
    process.env.OPERATOR_NOTIFY_EMAIL ??
    process.env.ADMIN_EMAIL ??
    "admin@fstec.local"
  )
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim())
}

export function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT ?? 1025),
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: process.env.SMTP_PASS?.trim() || undefined,
    from: process.env.SMTP_FROM?.trim() ?? "noreply@fstec.local",
  }
}

export function getCronSecret() {
  return process.env.CRON_SECRET?.trim()
}
