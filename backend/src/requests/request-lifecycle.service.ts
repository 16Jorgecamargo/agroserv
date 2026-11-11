import { Injectable } from '@nestjs/common';
import { notFound } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import type { ActorRole, NotificationType, Role } from '../common/types.js';
import { NotificationsService, requestLink } from '../notifications/notifications.service.js';
import type { User } from '../users/entities/user.entity.js';
import type { RequestEvent } from './entities/request-event.entity.js';
import type { ServiceRequest } from './entities/service-request.entity.js';
import { allowedActions, applyTransition, TransitionName } from './request-lifecycle.js';
import { RequestDetailView, toRequestDetailView } from './request.presenter.js';
import { RequestsRepository } from './requests.repository.js';

export interface Actor {
  id: string | null;
  role: ActorRole;
  name: string;
}

export interface TransitionInput {
  changes?: Partial<ServiceRequest>;
  note?: string;
  event?: Partial<RequestEvent>;
  suspendedUserId?: string;
}

interface TransitionNotice {
  to: 'producer' | 'provider' | 'other';
  type: NotificationType;
  title: string;
}

const NOTICES: Record<TransitionName, TransitionNotice> = {
  accept: { to: 'producer', type: 'request_status', title: 'Sua solicitação foi agendada' },
  reject: { to: 'producer', type: 'request_status', title: 'Sua solicitação foi recusada' },
  counter_offer: { to: 'producer', type: 'counter_offer', title: 'Você recebeu uma contraproposta' },
  accept_counter_offer: { to: 'provider', type: 'request_status', title: 'Contraproposta aceita' },
  decline_counter_offer: { to: 'provider', type: 'request_status', title: 'Contraproposta recusada' },
  producer_cancel: { to: 'provider', type: 'request_status', title: 'Solicitação cancelada pelo produtor' },
  provider_cancel: { to: 'producer', type: 'request_status', title: 'Solicitação cancelada pelo prestador' },
  system_cancel: { to: 'other', type: 'request_status', title: 'Solicitação cancelada pela administração' },
  start: { to: 'producer', type: 'request_status', title: 'Serviço em andamento' },
  complete: { to: 'producer', type: 'request_status', title: 'Serviço concluído. Conte como foi.' },
};

const PHONE_STATUSES = ['accepted', 'in_progress', 'completed'];

export function actorOf(user: User): Actor {
  // Quem executa a ação, para a linha do tempo
  return { id: user.id, role: user.role, name: user.name };
}

export const SYSTEM_ACTOR: Actor = { id: null, role: 'system', name: 'Sistema' };

export type ReviewLoader = (request: ServiceRequest) => Promise<{ view: unknown; editableUntil: string } | null>;

@Injectable()
export class RequestLifecycleService {
  private reviewLoader: ReviewLoader = () => Promise.resolve(null);

  constructor(
    private readonly requests: RequestsRepository,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  useReviewLoader(loader: ReviewLoader): void {
    // O módulo de avaliações registra como carregar a avaliação do detalhe
    this.reviewLoader = loader;
  }

  async load(id: string, participant?: { role: Role; id: string }): Promise<ServiceRequest> {
    // Quem não participa da solicitação recebe 404, não 403
    const request = await this.requests.findById(id);
    const owner = participant?.role === 'provider' ? request?.providerId : request?.producerId;
    if (!request || (participant && owner !== participant.id)) {
      throw notFound('request_not_found', 'Solicitação não encontrada.');
    }
    return request;
  }

  async detail(id: string, role: Role): Promise<RequestDetailView> {
    // Monta o detalhe com as ações permitidas para quem está pedindo
    const request = await this.load(id);
    const review = request.reviewId ? await this.reviewLoader(request) : null;
    const state = { reviewed: !!request.reviewId, editableUntil: review?.editableUntil, now: this.clock.nowIso() };
    return toRequestDetailView(request, {
      showPhones: role === 'admin' || PHONE_STATUSES.includes(request.status),
      allowedActions: allowedActions(role, request, this.clock.today(), state),
      review: review?.view,
    });
  }

  async transition(
    request: ServiceRequest,
    name: TransitionName,
    actor: Actor,
    input: TransitionInput = {},
  ): Promise<void> {
    // Valida a transição pela tabela única e grava o novo status
    const rule = applyTransition(name, request, this.clock.today());
    const now = this.clock.nowIso();
    await this.requests.update(request.id, { ...input.changes, status: rule.to, updatedAt: now });

    // Toda transição gera um evento na linha do tempo
    await this.requests.addEvent({
      requestId: request.id,
      type: rule.event,
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      note: input.note ?? null,
      createdAt: now,
      ...input.event,
    });

    // E avisa a outra parte da solicitação
    const notice = NOTICES[name];
    const suspendedIsProducer = input.suspendedUserId === request.producerId;
    const target = notice.to === 'other' ? (suspendedIsProducer ? 'provider' : 'producer') : notice.to;
    await this.notifications.notify({
      userId: target === 'producer' ? request.producerId : request.providerId,
      type: notice.type,
      title: notice.title,
      link: requestLink(target, request.id),
    });
  }

  async cancelOpenRequestsOf(userId: string): Promise<void> {
    // Efeito da suspensão: o sistema cancela tudo o que a conta tinha em aberto
    const open = await this.requests.findOpenByParticipant(userId);
    for (const request of open) {
      await this.transition(request, 'system_cancel', SYSTEM_ACTOR, {
        changes: { cancelledBy: 'system', cancelReason: 'Conta suspensa pela administração' },
        note: 'Conta suspensa pela administração',
        suspendedUserId: userId,
      });
    }
  }
}
