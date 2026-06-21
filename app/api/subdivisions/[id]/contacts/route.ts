import { createContactCollectionHandlers } from "@/lib/contacts/route-handlers"

const { GET, POST } = createContactCollectionHandlers("subdivision")

export { GET, POST }
