export class CommerceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "CommerceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function commerceErrorResponse(error: unknown) {
  if (error instanceof CommerceError) {
    const retryAfter =
      error.status === 429 && error.details && typeof error.details === "object" &&
      "retryAfter" in error.details && typeof error.details.retryAfter === "number"
        ? String(error.details.retryAfter)
        : undefined;
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details })
        }
      },
      {
        status: error.status,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          ...(retryAfter ? { "Retry-After": retryAfter } : {})
        }
      }
    );
  }

  if (error instanceof SyntaxError) {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "The request body must be valid JSON." } },
      { status: 400 }
    );
  }

  console.error("Commerce operation failed.", error);
  return Response.json(
    { error: { code: "COMMERCE_OPERATION_FAILED", message: "The commerce operation could not be completed." } },
    { status: 500 }
  );
}
