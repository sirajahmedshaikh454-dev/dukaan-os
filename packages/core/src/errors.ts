/** An error that is safe to show to the user. Anything else becomes a plain 500. */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
