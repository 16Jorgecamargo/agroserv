import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/auth.decorators.js';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    // Resposta simples para conferir se a API está no ar
    return { status: 'ok' };
  }
}
