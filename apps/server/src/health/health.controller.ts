import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

/**
 * The liveness probe. Public on purpose — a health check that needs a
 * credential cannot be used by the thing that would restart us.
 *
 * It reports that the process is up and configured (it started, so the
 * environment validated). It deliberately does not reach Supabase: a
 * dependency being down is not a reason to kill this process.
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health(): { status: string } {
    return { status: 'ok' };
  }
}
