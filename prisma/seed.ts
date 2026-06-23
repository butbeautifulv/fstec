import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { seedMockData } from "./mock-data.js"

const prisma = new PrismaClient()

const DEFAULT_STATUSES = [
  { name: "В работе", sortOrder: 0, isTerminal: false },
  { name: "Выполнено", sortOrder: 1, isTerminal: true },
]

const LEGACY_OVERDUE_STATUS = "Просрочено"

async function migrateLegacyOverdueStatus() {
  const overdueStatus = await prisma.status.findUnique({
    where: { name: LEGACY_OVERDUE_STATUS },
  })
  if (!overdueStatus) return

  const inProgress = await prisma.status.findUnique({
    where: { name: "В работе" },
  })
  if (!inProgress) return

  await prisma.orderItem.updateMany({
    where: { statusId: overdueStatus.id },
    data: { statusId: inProgress.id },
  })

  await prisma.status.delete({ where: { id: overdueStatus.id } })
}

async function migrateRemovedNotStartedStatus() {
  const inProgress = await prisma.status.findUnique({
    where: { name: "В работе" },
  })
  if (!inProgress) return

  const removed = await prisma.status.findMany({
    where: { name: { in: ["К исполнению", "Не начато"] } },
    select: { id: true },
  })
  if (removed.length === 0) return

  await prisma.orderItem.updateMany({
    where: { statusId: { in: removed.map((s) => s.id) } },
    data: { statusId: inProgress.id },
  })

  await prisma.status.deleteMany({
    where: { id: { in: removed.map((s) => s.id) } },
  })
}

async function main() {
  await migrateRemovedNotStartedStatus()

  for (const status of DEFAULT_STATUSES) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: status,
      create: status,
    })
  }

  await migrateLegacyOverdueStatus()

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, timezone: "Europe/Moscow" },
  })

  const email = process.env.ADMIN_EMAIL ?? "admin@fstec.local"
  const password = process.env.ADMIN_PASSWORD ?? "admin123"
  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Admin", role: UserRole.SUPER_ADMIN },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  })

  console.log("Seed complete: statuses + admin user", email)

  if (process.env.SEED_MOCK === "force" || process.env.SEED_MOCK === "true") {
    await seedMockData(prisma, admin.id, {
      force: process.env.SEED_MOCK === "force",
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
