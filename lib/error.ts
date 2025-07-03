export class InternalError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const isGeneratedError = (err: any) => {
  return err instanceof InternalError
}
