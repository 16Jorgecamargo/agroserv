import { Injectable } from '@nestjs/common';
import { validationError } from '../exceptions/app.exception.js';
import { addDays, brasiliaDay, ClockService } from './clock.service.js';
import { roundMoney } from '../utils/text.js';
import { ProviderProfilesRepository } from '../repositories/provider-profiles.repository.js';
import { roundRating } from '../utils/ratings.js';
import type { User } from '../entities/user.entity.js';
import { DATE_MESSAGE } from '../dto/producer-request.dto.js';
import type { CounterOfferDto, ProviderCancelDto, RejectRequestDto } from '../dto/provider-request.dto.js';
import type { RequestEvent } from '../entities/request-event.entity.js';
import { actorOf, RequestLifecycleService } from './request-lifecycle.service.js';
import { applyTransition } from '../utils/request-lifecycle.js';
import { parseStatusFilter } from '../utils/request-status.js';
import { RequestDetailView, RequestView, toRequestView } from '../presenters/request.presenter.js';
import { RequestsRepository } from '../repositories/requests.repository.js';

export interface ProviderDashboardView {
  stats: {
    newRequests: number;
    upcoming: number;
    inProgress: number;
    acceptanceRate: number | null;
    averageRating: number;
    monthEstimatedValue: number;
  };
  pendingRequests: RequestView[];
  upcomingRequests: RequestView[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_RESPONSES = ['accepted', 'rejected', 'counter_offer'];

@Injectable()
export class ProviderRequestsService {
  constructor(
    private readonly requests: RequestsRepository,
    private readonly lifecycle: RequestLifecycleService,
    private readonly profiles: ProviderProfilesRepository,
    private readonly clock: ClockService,
  ) {}

  async list(providerId: string, status: unknown): Promise<RequestView[]> {
    // Solicitações recebidas, com filtro opcional por status
    const requests = await this.requests.findByProvider(providerId, parseStatusFilter(status));
    return requests.map(toRequestView);
  }

  async detail(provider: User, id: string): Promise<RequestDetailView> {
    // Só o prestador da solicitação abre o detalhe
    await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    return this.lifecycle.detail(id, 'provider');
  }

  async accept(provider: User, id: string): Promise<RequestDetailView> {
    // Aceitar confirma a data pedida, mesmo em dia bloqueado
    const request = await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    await this.lifecycle.transition(request, 'accept', actorOf(provider));
    return this.lifecycle.detail(id, 'provider');
  }

  async reject(provider: User, id: string, dto: RejectRequestDto): Promise<RequestDetailView> {
    // A recusa guarda o motivo informado ao produtor
    const request = await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    await this.lifecycle.transition(request, 'reject', actorOf(provider), {
      changes: { rejectReason: dto.reason },
      note: dto.reason,
    });
    return this.lifecycle.detail(id, 'provider');
  }

  async counterOffer(provider: User, id: string, dto: CounterOfferDto): Promise<RequestDetailView> {
    // Tela desatualizada recebe 409 antes da validação dos campos
    const request = await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    applyTransition('counter_offer', request, this.clock.today());

    // Precisa propor nova data e/ou novo valor total, diferente do atual
    const date = dto.date !== undefined && dto.date !== request.scheduledDate ? dto.date : null;
    const value = dto.value !== undefined && dto.value !== request.value ? dto.value : null;
    if (date === null && value === null) throw validationError({ date: 'Proponha uma nova data ou um novo valor.' });
    if (date !== null && date < this.clock.today()) throw validationError({ date: DATE_MESSAGE });

    // A quantidade não muda; a proposta fica guardada na solicitação
    await this.lifecycle.transition(request, 'counter_offer', actorOf(provider), {
      changes: {
        counterDate: date,
        counterValue: value,
        counterMessage: dto.message,
        counterCreatedAt: this.clock.nowIso(),
      },
      note: dto.message,
    });
    return this.lifecycle.detail(id, 'provider');
  }

  async start(provider: User, id: string): Promise<RequestDetailView> {
    // O serviço só começa a partir da data agendada
    const request = await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    await this.lifecycle.transition(request, 'start', actorOf(provider));
    return this.lifecycle.detail(id, 'provider');
  }

  async complete(provider: User, id: string): Promise<RequestDetailView> {
    // Concluir libera a avaliação para o produtor
    const request = await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    await this.lifecycle.transition(request, 'complete', actorOf(provider));
    return this.lifecycle.detail(id, 'provider');
  }

  async cancel(provider: User, id: string, dto: ProviderCancelDto): Promise<RequestDetailView> {
    // O prestador só cancela o que já estava agendado, sempre com motivo
    const request = await this.lifecycle.load(id, { role: 'provider', id: provider.id });
    await this.lifecycle.transition(request, 'provider_cancel', actorOf(provider), {
      changes: { cancelledBy: 'provider', cancelReason: dto.reason },
      note: dto.reason,
    });
    return this.lifecycle.detail(id, 'provider');
  }

  async dashboard(providerId: string): Promise<ProviderDashboardView> {
    // Carrega as solicitações, os eventos e o perfil do prestador
    const today = this.clock.today();
    const weekEnd = addDays(today, 7);
    const requests = await this.requests.findByProvider(providerId);
    const events = await this.requests.findEventsByProvider(providerId);
    const profile = await this.profiles.findByUserId(providerId);

    // Pendentes mais antigas primeiro e agendadas dos próximos 7 dias por data
    const pending = requests.filter((item) => item.status === 'pending');
    const upcoming = requests.filter(
      (item) => item.status === 'accepted' && item.scheduledDate >= today && item.scheduledDate <= weekEnd,
    );
    pending.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    upcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

    // Valor estimado das concluídas no mês atual, pelo evento de conclusão
    const month = today.slice(0, 7);
    const completedThisMonth = new Set(
      events
        .filter((event) => event.type === 'completed' && brasiliaDay(event.createdAt).startsWith(month))
        .map((event) => event.requestId),
    );
    const monthValue = requests
      .filter((item) => item.status === 'completed' && completedThisMonth.has(item.id))
      .reduce((sum, item) => sum + item.value, 0);

    // Monta os números do painel
    const stats = {
      newRequests: pending.length,
      upcoming: upcoming.length,
      inProgress: requests.filter((item) => item.status === 'in_progress').length,
      acceptanceRate: this.acceptanceRate(events),
      averageRating: roundRating(profile?.rating ?? 0),
      monthEstimatedValue: roundMoney(monthValue),
    };
    return {
      stats,
      pendingRequests: pending.slice(0, 5).map(toRequestView),
      upcomingRequests: upcoming.slice(0, 5).map(toRequestView),
    };
  }

  private acceptanceRate(events: RequestEvent[]): number | null {
    // Agrupa os eventos por solicitação, já em ordem cronológica
    const byRequest = new Map<string, RequestEvent[]>();
    for (const event of events) {
      byRequest.set(event.requestId, [...(byRequest.get(event.requestId) ?? []), event]);
    }

    // Considera as solicitações respondidas pelo prestador nos últimos 90 dias
    const since = this.clock.isoFromNow(-90 * DAY_MS);
    let answered = 0;
    let accepted = 0;
    for (const history of byRequest.values()) {
      const first = history.find((event) => FIRST_RESPONSES.includes(event.type));
      if (!first || first.createdAt < since) continue;
      answered += 1;
      const viaCounter = history.some((event) => event.type === 'counter_offer_accepted');
      if (first.type === 'accepted' || viaCounter) accepted += 1;
    }
    return answered ? accepted / answered : null;
  }
}
