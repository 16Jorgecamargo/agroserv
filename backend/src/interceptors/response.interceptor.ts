import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Embrulha o retorno do controller no envelope de sucesso
    return next.handle().pipe(map((data: unknown) => this.wrap(data)));
  }

  private wrap(data: unknown): unknown {
    // Respostas sem corpo (204) e arquivos passam sem envelope
    if (data === undefined || data instanceof StreamableFile) return data;
    return { success: true, data };
  }
}
