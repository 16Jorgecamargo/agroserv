import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { FieldErrors, validationError } from '../exceptions/app.exception.js';

function collectFieldErrors(
  errors: ValidationError[],
  target: FieldErrors = {},
): FieldErrors {
  // Guarda a primeira mensagem de cada campo, incluindo campos aninhados
  for (const error of errors) {
    const message = Object.values(error.constraints ?? {})[0];
    if (message && !target[error.property]) target[error.property] = message;
    if (error.children?.length && !target[error.property]) {
      const nested = collectFieldErrors(error.children);
      const first = Object.values(nested)[0];
      if (first) target[error.property] = first;
    }
  }
  return target;
}

export function createValidationPipe(): ValidationPipe {
  // Valida os DTOs e responde 422 com as mensagens por campo
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: (errors) => validationError(collectFieldErrors(errors)),
  });
}

function trimDeep(value: unknown): unknown {
  // Remove espaços das pontas de todo texto recebido
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(trimDeep);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return Object.fromEntries(entries.map(([key, item]) => [key, trimDeep(item)]));
  }
  return value;
}

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Só o corpo e a query string são normalizados
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    return trimDeep(value);
  }
}
