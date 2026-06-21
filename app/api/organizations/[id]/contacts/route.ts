import { createContactCollectionHandlers } from "@/lib/contacts/route-handlers"

const { GET, POST } = createContactCollectionHandlers("org")

export { GET, POST }
