import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiError, isApiErrorResponse, isValidationErrorPayload } from '../models/api-error.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Set on a request to stop the interceptor from showing a toast, when the caller
 * wants to render the error itself (e.g. a form showing field-level validation).
 *
 * `api.get(path, { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) })`
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

const DEFAULT_MESSAGES: Readonly<Record<number, string>> = {
  0: 'Cannot reach the server. Check your connection or that the API is running.',
  400: 'The request was invalid.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current state of the resource.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An unexpected server error occurred. Please try again later.',
};

/**
 * Central HTTP error handling: normalizes every failure into {@link ApiError},
 * shows a toast for the common status codes, triggers re-authentication on 401,
 * and rethrows so callers can still react (finish loading states, etc.).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const apiError = toApiError(error);
      const notify = !req.context.get(SKIP_ERROR_NOTIFICATION);
      debugger;
      switch (apiError.status) {
        case 0:
          if (notify) notifications.error(apiError.message, { title: 'Network error' });
          break;

        case 400:
          if (notify) {
            notifications.warning(apiError.message, {
              title: apiError.isValidationError ? 'Validation failed' : 'Bad request',
            });
          }
          break;

        case 401:
          if (notify) notifications.warning(DEFAULT_MESSAGES[401], { title: 'Unauthorized' });
          auth.handleUnauthorized(router.url);
          break;

        case 403:
          if (notify) notifications.error(apiError.message, { title: 'Forbidden' });
          break;

        case 404:
          if (notify) notifications.warning(apiError.message, { title: 'Not found' });
          break;

        default:
          if (notify) {
            notifications.error(apiError.status >= 500 ? DEFAULT_MESSAGES[500] : apiError.message, {
              title: apiError.status >= 500 ? 'Server error' : `Error ${apiError.status}`,
            });
          }
          break;
      }

      return throwError(() => apiError);
    }),
  );
};

function toApiError(response: HttpErrorResponse): ApiError {
  const body = isApiErrorResponse(response.error) ? response.error : null;
  const validationErrors = body && isValidationErrorPayload(body.message) ? body.message.errors : [];

  let message: string;
  if (validationErrors.length > 0) {
    message = validationErrors.map((e) => e.errorMessage).join(' ');
  } else if (body && typeof body.message === 'string' && body.message.trim().length > 0) {
    message = body.message;
  } else {
    message = DEFAULT_MESSAGES[response.status] ?? response.message;
  }

  // The API only fills `details` in its Development environment (e.g. why a token was rejected).
  // Surface it in the dev build of the client so the toast explains the failure.
  if (!environment.production && body?.details) {
    message = `${message}\n${body.details}`;
  }

  return new ApiError(response.status, message, validationErrors, body?.traceId ?? null, response);
}
