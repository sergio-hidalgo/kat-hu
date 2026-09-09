import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { API_ERROR_CODES, apiError, type ApiError } from '@kat-hu/contracts';
import type { Response } from 'express';
import { ZodError } from 'zod';

/**
 * Every error leaves this API in one shape (`skills/server-core`):
 *
 * ```json
 * { "code": "auth.unauthorized", "message": "…", "details": {} }
 * ```
 *
 * `code` is stable and English so the client can branch on it; `message` is
 * Spanish and safe to render; `details` carries per-field messages for a form.
 * A stack trace, a Postgres message or the submitted payload never crosses
 * this line — the real cause is logged, the visitor gets the sentence above.
 */

/** Spanish, and written to be shown to a visitor as-is. */
const MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Revisa los datos e inténtalo de nuevo.',
  [HttpStatus.UNAUTHORIZED]: 'Necesitas iniciar sesión para hacer esto.',
  [HttpStatus.FORBIDDEN]: 'No tienes permiso para hacer esto.',
  [HttpStatus.NOT_FOUND]: 'No encontramos lo que buscas.',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Espera un momento antes de volver a enviar.',
};

const FALLBACK_MESSAGE = 'Algo no ha ido bien por nuestra parte. Inténtalo en un momento.';

const CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: API_ERROR_CODES.validationFailed,
  [HttpStatus.UNAUTHORIZED]: API_ERROR_CODES.unauthorized,
  [HttpStatus.FORBIDDEN]: API_ERROR_CODES.forbidden,
  [HttpStatus.NOT_FOUND]: 'request.not_found',
  [HttpStatus.TOO_MANY_REQUESTS]: 'request.rate_limited',
};

/** `{ email: "Escribe un email válido" }` — first message wins per field. */
function fieldErrors(error: ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    if (field && !(field in details)) details[field] = issue.message;
  }
  return details;
}

/**
 * Translate anything thrown inside Nest into the wire shape.
 * Exported separately from the filter so it can be tested without a request.
 */
export function toApiError(exception: unknown): { status: number; body: ApiError } {
  if (exception instanceof ZodError) {
    return {
      status: HttpStatus.BAD_REQUEST,
      body: apiError(
        API_ERROR_CODES.validationFailed,
        MESSAGES[HttpStatus.BAD_REQUEST]!,
        fieldErrors(exception),
      ),
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    /**
     * A thrown `HttpException` whose body is already our shape passes through
     * untouched — that is how a service says something specific
     * (`booking.rate_limited`) rather than the generic message for its status.
     */
    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      'message' in response
    ) {
      const known = response as Partial<ApiError>;
      return {
        status,
        body: apiError(String(known.code), String(known.message), known.details ?? {}),
      };
    }

    return {
      status,
      body: apiError(
        CODES[status] ?? API_ERROR_CODES.internal,
        MESSAGES[status] ?? FALLBACK_MESSAGE,
      ),
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: apiError(API_ERROR_CODES.internal, FALLBACK_MESSAGE),
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toApiError(exception);
    const response = host.switchToHttp().getResponse<Response>();

    /**
     * Only ours-not-theirs failures are worth a stack. Log the code and the
     * status, never the body of the request (`security-check` §6).
     */
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${status} ${body.code}`, (exception as Error)?.stack);
    }

    response.status(status).json(body);
  }
}
