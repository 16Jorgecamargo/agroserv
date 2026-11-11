import { DEFAULT_TRANSITION_MESSAGE, invalidTransition } from '../common/app.exception.js';
import { OPEN_STATUSES } from '../common/types.js';
import type { RequestAction, RequestEventType, RequestStatus, Role } from '../common/types.js';

export type TransitionName =
  | 'accept' | 'reject' | 'counter_offer' | 'producer_cancel' | 'provider_cancel'
  | 'accept_counter_offer' | 'decline_counter_offer' | 'start' | 'complete' | 'system_cancel';

interface TransitionRule {
  from: RequestStatus[];
  to: RequestStatus;
  event: RequestEventType;
}

export interface LifecycleRequest {
  status: RequestStatus;
  scheduledDate: string;
  counterDate: string | null;
}

export interface ReviewState {
  reviewed: boolean;
  editableUntil?: string;
  now: string;
}

export const TRANSITIONS: Record<TransitionName, TransitionRule> = {
  accept: { from: ['pending'], to: 'accepted', event: 'accepted' },
  reject: { from: ['pending'], to: 'rejected', event: 'rejected' },
  counter_offer: { from: ['pending'], to: 'counter_offer', event: 'counter_offer' },
  producer_cancel: { from: ['pending', 'counter_offer', 'accepted'], to: 'cancelled', event: 'cancelled' },
  provider_cancel: { from: ['accepted'], to: 'cancelled', event: 'cancelled' },
  accept_counter_offer: { from: ['counter_offer'], to: 'accepted', event: 'counter_offer_accepted' },
  decline_counter_offer: { from: ['counter_offer'], to: 'cancelled', event: 'counter_offer_declined' },
  start: { from: ['accepted'], to: 'in_progress', event: 'started' },
  complete: { from: ['in_progress'], to: 'completed', event: 'completed' },
  system_cancel: { from: OPEN_STATUSES, to: 'cancelled', event: 'cancelled' },
};

export function isOpen(status: RequestStatus): boolean {
  // Aberta = pendente, contraproposta, agendada ou em andamento
  return OPEN_STATUSES.includes(status);
}

export function effectiveCounterDate(request: LifecycleRequest): string {
  // Data que vale se a contraproposta for aceita
  return request.counterDate ?? request.scheduledDate;
}

function dateBlock(name: TransitionName, request: LifecycleRequest, today: string): string | null {
  // Regras de data de cada transição, com a mensagem do contrato
  if (name === 'accept' && request.scheduledDate < today) {
    return 'A data pedida já passou. Faça uma contraproposta com uma nova data.';
  }
  if (name === 'accept_counter_offer' && effectiveCounterDate(request) < today) {
    return 'A data proposta já passou. Recuse a proposta ou cancele a solicitação.';
  }
  if (name === 'start' && today < request.scheduledDate) {
    return 'O serviço só pode ser iniciado a partir da data agendada.';
  }
  return null;
}

export function applyTransition(
  name: TransitionName,
  request: LifecycleRequest,
  today: string,
): TransitionRule {
  // Única porta de entrada das mudanças de status (tabela da seção 6)
  const rule = TRANSITIONS[name];
  if (!rule.from.includes(request.status)) throw invalidTransition(DEFAULT_TRANSITION_MESSAGE);

  // Datas que já passaram bloqueiam aceitar e iniciar
  const blocked = dateBlock(name, request, today);
  if (blocked) throw invalidTransition(blocked);
  return rule;
}

function canApply(name: TransitionName, request: LifecycleRequest, today: string): boolean {
  // Diz se a transição passaria agora, sem lançar erro
  const allowed = TRANSITIONS[name].from.includes(request.status);
  return allowed && dateBlock(name, request, today) === null;
}

export function allowedActions(
  role: Role,
  request: LifecycleRequest,
  today: string,
  review: ReviewState,
): RequestAction[] {
  // Administrador só lê
  if (role === 'admin') return [];
  const actions: RequestAction[] = [];
  const add = (action: RequestAction, when: boolean) => when && actions.push(action);

  // Ações do produtor em cada status
  if (role === 'producer') {
    add('accept_counter_offer', canApply('accept_counter_offer', request, today));
    add('decline_counter_offer', canApply('decline_counter_offer', request, today));
    add('cancel', canApply('producer_cancel', request, today));
    add('review', request.status === 'completed' && !review.reviewed);
    const editable = review.reviewed && !!review.editableUntil && review.now <= review.editableUntil;
    add('edit_review', request.status === 'completed' && editable);
  }

  // Ações do prestador em cada status
  if (role === 'provider') {
    add('accept', canApply('accept', request, today));
    add('reject', canApply('reject', request, today));
    add('counter_offer', canApply('counter_offer', request, today));
    add('start', canApply('start', request, today));
    add('complete', canApply('complete', request, today));
    add('cancel', canApply('provider_cancel', request, today));
  }

  // Conversa só com a solicitação aberta; denúncia sempre
  add('message', isOpen(request.status));
  actions.push('report');
  return actions;
}
