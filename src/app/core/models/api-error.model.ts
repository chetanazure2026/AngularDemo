import { HttpErrorResponse } from '@angular/common/http';

/** One FluentValidation failure as returned by the API in a 400 response. */
export interface ValidationError {
  readonly propertyName: string;
  readonly errorMessage: string;
}

/** `message` payload of a 400 validation response. */
export interface ValidationErrorPayload {
  readonly errors: readonly ValidationError[];
}

/** Error envelope produced by the API's ExceptionHandlingMiddleware / JWT challenge. */
export interface ApiErrorResponse {
  readonly statusCode: number;
  readonly message: string | ValidationErrorPayload;
  readonly traceId: string | null;
  readonly timestamp: string;
  readonly path: string | null;
  readonly details: string | null;
}

/** Normalized error every consumer receives from the HTTP layer. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly validationErrors: readonly ValidationError[],
    readonly traceId: string | null,
    readonly response: HttpErrorResponse,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isValidationError(): boolean {
    return this.validationErrors.length > 0;
  }

  /** Validation messages for a given form field, matching the API's PascalCase property names case-insensitively. */
  messagesFor(field: string): readonly string[] {
    return this.validationErrors
      .filter((e) => e.propertyName.toLowerCase() === field.toLowerCase())
      .map((e) => e.errorMessage);
  }
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    typeof (value as { statusCode: unknown }).statusCode === 'number' &&
    'message' in value
  );
}

export function isValidationErrorPayload(value: unknown): value is ValidationErrorPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'errors' in value &&
    Array.isArray((value as { errors: unknown }).errors)
  );
}
