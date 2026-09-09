import { z } from 'zod';

/**
 * A *reserva* — the request a visitor sends to ask the florapeuta for an
 * online session. The landing page's one job.
 *
 * **Placeholder.** Spec 04 defines only the fields spec 06's form is certain
 * to send, so that `apps/server` has something real to validate against and
 * the wiring can be tested end to end. Spec 06 owns the finished schema:
 * the *franja* vocabulary, the consent copy, honeypot/rate-limit fields and
 * the Spanish messages the form actually shows. Columns it maps to are in
 * `skills/db-schema` (`public.booking_requests`).
 */
export const bookingRequestSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre').max(120),
  email: z.email('Escribe un email válido').max(254),
  /** Optional: some people prefer to be called. Free text — spec 06 narrows it. */
  phone: z.string().trim().max(40).optional(),
  /** Who lives at home — the *familia multiespecie*: cats and humans. */
  family: z.string().trim().max(2000).optional(),
  /** What they want help with. The only long field that is required. */
  concern: z.string().trim().min(10, 'Cuéntanos un poco más').max(4000),
  /**
   * Preferred *franja*. Free text until a franja table exists (`db-schema`),
   * so this stays a string here on purpose.
   */
  preferredFranja: z.string().trim().max(120).optional(),
  /** Consent must be given actively; an unchecked box is not a submission. */
  consent: z.literal(true, 'Necesitamos tu consentimiento para responderte'),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
