import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    // Registra método, rota, status e duração ao fim da resposta
    const startedAt = Date.now();
    response.on('finish', () => {
      const elapsed = Date.now() - startedAt;
      const path = request.originalUrl.split('?')[0];
      this.logger.log(
        `${request.method} ${path} ${response.statusCode} ${elapsed}ms`,
      );
    });

    // Segue para a próxima etapa da requisição
    next();
  }
}
