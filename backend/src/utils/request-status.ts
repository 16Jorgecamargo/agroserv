import { badRequest } from '../exceptions/app.exception.js';
import { REQUEST_STATUSES } from '../types/index.js';
import type { RequestStatus } from '../types/index.js';

export function parseStatusFilter(value: unknown): RequestStatus | undefined {
  // Sem filtro ou "all" lista tudo; valor desconhecido é erro 400
  if (value === undefined || value === '' || value === 'all') return undefined;
  if (!REQUEST_STATUSES.includes(value as RequestStatus)) {
    throw badRequest('invalid_status', 'Status de solicitação inválido.');
  }
  return value as RequestStatus;
}
