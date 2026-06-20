import { prisma } from "@/lib/db"

export async function getResponse(id: number) {
  return prisma.response.findUnique({
    where: { id },
    include: {
      orderItem: {
        include: {
          measure: { select: { id: true, name: true } },
          subdivision: { select: { id: true, name: true } },
          order: {
            select: {
              id: true,
              title: true,
              organization: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })
}
