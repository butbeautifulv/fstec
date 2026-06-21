export class BatchCreateValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BatchCreateValidationError"
  }
}
