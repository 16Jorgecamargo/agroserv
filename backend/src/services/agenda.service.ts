import { Injectable } from '@nestjs/common';
import { validationError } from '../exceptions/app.exception.js';
import { addDays, ClockService, isValidDay } from './clock.service.js';
import { RequestView, toRequestView } from '../presenters/request.presenter.js';
import { RequestsRepository } from '../repositories/requests.repository.js';
import { CatalogService } from './catalog.service.js';
import type { User } from '../entities/user.entity.js';
import { BlockedDaysRepository } from '../repositories/blocked-days.repository.js';

export interface AgendaView {
  month: string;
  blockedDays: string[];
  requests: RequestView[];
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_RANGE_DAYS = 366;

@Injectable()
export class AgendaService {
  constructor(
    private readonly blockedDays: BlockedDaysRepository,
    private readonly requests: RequestsRepository,
    private readonly catalog: CatalogService,
    private readonly clock: ClockService,
  ) {}

  async month(providerId: string, requested: unknown): Promise<AgendaView> {
    // Mês pedido, ou o mês atual quando ausente ou inválido
    const valid = typeof requested === 'string' && MONTH_PATTERN.test(requested);
    const month = valid ? requested : this.clock.today().slice(0, 7);
    const from = `${month}-01`;
    const to = `${month}-31`;

    // Dias bloqueados e solicitações agendadas, em andamento e concluídas do mês
    const blockedDays = await this.blockedDays.findBetween(providerId, from, to);
    const requests = await this.requests.findForAgenda(providerId, from, to);
    return { month, blockedDays, requests: requests.map(toRequestView) };
  }

  async block(providerId: string, date: string): Promise<{ date: string }> {
    // Só dá para bloquear de hoje em diante; repetir o bloqueio não é erro
    if (date < this.clock.today()) throw validationError({ date: 'Escolha uma data a partir de hoje.' });
    await this.blockedDays.add(providerId, date);
    return { date };
  }

  async unblock(providerId: string, date: string): Promise<void> {
    // Desbloquear um dia livre também responde 204
    await this.blockedDays.remove(providerId, date);
  }

  async blockedDaysOfService(serviceId: string, query: Record<string, unknown>, viewer?: User): Promise<string[]> {
    // Mesma regra de acesso do detalhe do serviço
    const service = await this.catalog.findForViewer(serviceId, viewer);

    // Intervalo padrão de hoje a hoje + 90 dias, limitado a 366 dias
    const today = this.clock.today();
    const from = isValidDay(query.from) ? query.from : today;
    const requestedTo = isValidDay(query.to) ? query.to : addDays(from, 90);
    const limit = addDays(from, MAX_RANGE_DAYS);
    const to = requestedTo > limit ? limit : requestedTo;
    return this.blockedDays.findBetween(service.providerId, from, to);
  }
}
