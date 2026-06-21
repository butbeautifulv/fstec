import { NextResponse } from "next/server"
import { labels } from "@/lib/ui/branding"

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401)
    }
    if (error.message === "NOT_FOUND") {
      return jsonError("Not found", 404)
    }
    if (error.message === "INVALID_TARGETS") {
      return jsonError("Некорректный список получателей поручения", 400)
    }
    if (error.message === "INVALID_MEASURES") {
      return jsonError("Одна или несколько мер не найдены", 400)
    }
    if (error.message === "PRIMARY_CONTACT_EXISTS") {
      return jsonError("Главный ответственный уже назначен в этой области", 409)
    }
    if (error.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403)
    }
    if (error.message === "MEASURE_IN_USE") {
      return jsonError("Мера используется в поручениях и не может быть удалена", 409)
    }
    if (error.message === "ORG_HAS_ORDERS") {
      return jsonError(`У ${labels.orgGenitive} есть поручения — сначала удалите их`, 409)
    }
    if (error.message === "EMAIL_EXISTS") {
      return jsonError("Пользователь с таким email уже существует", 409)
    }
    if (error.message === "LAST_SUPER_ADMIN") {
      return jsonError("Нельзя понизить роль последнего суперадминистратора", 409)
    }
    if (error.message === "CANNOT_DELETE_SELF") {
      return jsonError("Нельзя удалить собственную учётную запись", 409)
    }
    if (error.message === "USER_HAS_DATA") {
      return jsonError(
        "Нельзя удалить пользователя: есть связанные меры или поручения",
        409
      )
    }
    if (error.message === "INVALID_CURRENT_PASSWORD") {
      return jsonError("Неверный текущий пароль", 400)
    }
    if (error.message === "INVALID_MIME_TYPE") {
      return jsonError("Недопустимый тип файла. Разрешены JPEG, PNG, WebP, GIF", 400)
    }
    if (error.message === "INVALID_DOCX") {
      return jsonError("Разрешены только файлы .docx", 400)
    }
    if (error.message === "INVALID_FILE") {
      return jsonError("Файл не передан", 400)
    }
    if (error.message === "INVALID_PARENT_IMPORT") {
      return jsonError("Некорректный родительский документ", 400)
    }
    if (error.message === "IMPORT_INVALID_STATUS") {
      return jsonError("Недопустимый статус документа для операции", 400)
    }
    if (error.message === "NO_ITEMS" || error.message === "NO_ITEMS_FOUND") {
      return jsonError("Не удалось извлечь меры из документа", 400)
    }
    if (error.message === "INVALID_FILE_SIZE") {
      return jsonError("Размер файла должен быть от 1 байта до 20 МБ", 400)
    }
    if (error.message === "TOO_MANY_ATTACHMENTS") {
      return jsonError("Максимум 10 вложений на отчёт", 400)
    }
    if (error.message === "INVALID_ATTACHMENTS") {
      return jsonError("Некорректные вложения", 400)
    }
    if (error.message === "INVALID_STATUS") {
      return jsonError("Отчёт можно отправить только для меры в работе", 400)
    }
    if (error.message === "PENDING_EXISTS") {
      return jsonError("Отчёт уже отправлен и ожидает проверки", 409)
    }
    if (error.message === "REVIEW_NOTE_REQUIRED") {
      return jsonError("Укажите комментарий для исполнителя", 400)
    }
    if (error.message === "S3_NOT_CONFIGURED" || error.message === "S3 storage is not configured") {
      return jsonError("Хранилище файлов не настроено", 503)
    }
  }
  console.error(error)
  return jsonError("Internal server error", 500)
}
