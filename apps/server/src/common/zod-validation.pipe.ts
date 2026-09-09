import { Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates a request body against a schema from `@kat-hu/contracts`.
 *
 * DTOs *wrap* those schemas rather than redeclaring fields with
 * class-validator (`skills/server-core`), so the client and the server cannot
 * disagree about a payload. The `ZodError` this throws is turned into
 * `{ code, message, details }` by `ApiExceptionFilter` — the pipe itself does
 * not build a response.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    return this.schema.parse(value);
  }
}
