import { HttpException } from '@nestjs/common';

export type FieldErrors = Record<string, string>;

export interface ErrorBody {
  status: number;
  code: string;
  message: string;
  fields?: FieldErrors;
}

export class AppException extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: FieldErrors,
  ) {
    // Guarda o corpo do erro no formato do contrato
    super({ status, code, message, ...(fields ? { fields } : {}) }, status);
  }
}

export const DEFAULT_VALIDATION_MESSAGE = 'Revise os campos destacados.';
export const DEFAULT_TRANSITION_MESSAGE =
  'Esta ação não está mais disponível para esta solicitação.';

export function validationError(
  fields: FieldErrors,
  message = DEFAULT_VALIDATION_MESSAGE,
): AppException {
  // Erro de formulário com as mensagens por campo
  return new AppException(422, 'validation_error', message, fields);
}

export function badRequest(code: string, message: string): AppException {
  // Erro de requisição malformada
  return new AppException(400, code, message);
}

export function unauthorized(
  message = 'Sessão inválida. Faça login novamente.',
  code = 'unauthorized',
): AppException {
  // Sessão ausente, inválida ou de conta bloqueada
  return new AppException(401, code, message);
}

export function forbidden(
  message = 'Você não tem permissão para esta ação.',
  code = 'forbidden',
): AppException {
  // Papel sem acesso ao recurso
  return new AppException(403, code, message);
}

export function notFound(code: string, message: string): AppException {
  // Recurso inexistente ou de outro usuário
  return new AppException(404, code, message);
}

export function conflict(message: string): AppException {
  // Ação bloqueada por vínculos
  return new AppException(409, 'conflict', message);
}

export function invalidTransition(
  message = DEFAULT_TRANSITION_MESSAGE,
): AppException {
  // Ação não permitida no status atual
  return new AppException(409, 'invalid_transition', message);
}
