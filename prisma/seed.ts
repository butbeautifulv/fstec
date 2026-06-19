import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { seedMockData } from "./mock-data.js"

const prisma = new PrismaClient()

const DEFAULT_STATUSES = [
  { name: "К исполнению", sortOrder: 0, isTerminal: false },
  { name: "В работе", sortOrder: 1, isTerminal: false },
  { name: "Выполнено", sortOrder: 2, isTerminal: true },
]

const LEGACY_NOT_STARTED_STATUS = "Не начато"
const LEGACY_OVERDUE_STATUS = "Просрочено"

async function migrateLegacyNotStartedStatus() {
  const legacy = await prisma.status.findUnique({
    where: { name: LEGACY_NOT_STARTED_STATUS },
  })
  if (!legacy) return

  const target = await prisma.status.findUnique({
    where: { name: "К исполнению" },
  })

  if (target && target.id !== legacy.id) {
    await prisma.orderItem.updateMany({
      where: { statusId: legacy.id },
      data: { statusId: target.id },
    })
    await prisma.status.delete({ where: { id: legacy.id } })
  } else {
    await prisma.status.update({
      where: { id: legacy.id },
      data: { name: "К исполнению" },
    })
  }
}

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

async function main() {
  await migrateLegacyNotStartedStatus()

  for (const status of DEFAULT_STATUSES) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: status,
      create: status,
    })
  }

  await migrateLegacyOverdueStatus()

  const email = process.env.ADMIN_EMAIL ?? "admin@fstec.local"
  const password = process.env.ADMIN_PASSWORD ?? "admin123"
  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Admin", role: UserRole.ADMIN },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  console.log("Seed complete: statuses + admin user", email)

  if (process.env.SEED_MOCK !== "false") {
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
