import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppException, DEFAULT_VALIDATION_MESSAGE, ErrorBody } from '../exceptions/app.exception.js';

const STATUS_CODES: Record<number, [string, string]> = {
  400: ['validation_error', 'Requisição inválida.'],
  401: ['unauthorized', 'Sessão inválida. Faça login novamente.'],
  403: ['forbidden', 'Você não tem permissão para esta ação.'],
  404: ['route_not_found', 'Rota não encontrada.'],
  409: ['conflict', 'Não foi possível concluir a ação.'],
  429: [
    'too_many_attempts',
    'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  ],
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    // Converte qualquer falha no envelope padrão de erro
    const response = host.switchToHttp().getResponse<Response>();
    const error = this.toErrorBody(exception);
    response.status(error.status).json({ success: false, error });
  }

  private toErrorBody(exception: unknown): ErrorBody {
    // Erros de negócio já chegam no formato do contrato
    if (exception instanceof AppException) {
      return exception.getResponse() as ErrorBody;
    }

    // Arquivo acima do limite vira erro de formulário no campo do arquivo
    if (exception instanceof HttpException && exception.getStatus() === 413) {
      const fields = { file: 'O arquivo deve ter no máximo 5 MB.' };
      return { status: 422, code: 'validation_error', message: DEFAULT_VALIDATION_MESSAGE, fields };
    }

    // Exceções HTTP do framework recebem código e mensagem padrão
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const [code, message] = STATUS_CODES[status] ?? [
        'http_error',
        'Não foi possível concluir a requisição.',
      ];
      const isRoute = exception instanceof NotFoundException;
      return { status, code: isRoute ? 'route_not_found' : code, message };
    }

    // Falhas inesperadas ficam só no log interno
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    return {
      status: 500,
      code: 'server_error',
      message: 'Erro inesperado no servidor.',
    };
  }
}
