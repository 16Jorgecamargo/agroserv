import { Injectable } from '@nestjs/common';
import { AdminActionsService } from '../admin/admin-actions.service.js';
import { AdminServicesService } from '../admin/admin-services.service.js';
import { AdminUsersService } from '../admin/admin-users.service.js';
import { conflict, invalidTransition, notFound, validationError } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { Paginated, paginate, parsePage } from '../common/pagination.js';
import { REPORT_STATUSES, REPORT_TARGET_TYPES } from '../common/types.js';
import type {
  ReportReason, ReportResolutionAction, ReportStatus, ReportTargetType, Role,
} from '../common/types.js';
import { MessagesService, MessageView } from '../messages/messages.service.js';
import { notificationsLink, NotificationsService } from '../notifications/notifications.service.js';
import { RequestLifecycleService } from '../requests/request-lifecycle.service.js';
import { RequestsRepository } from '../requests/requests.repository.js';
import { toReviewView } from '../reviews/review.presenter.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { toServiceView } from '../services/service.presenter.js';
import { ServicesRepository } from '../services/services.repository.js';
import type { User } from '../users/entities/user.entity.js';
import { toUserView } from '../users/user.presenter.js';
import { ACTION_MESSAGE, NOT_ALLOWED_MESSAGE, USER_MESSAGE } from './dto/report.dto.js';
import type { CreateReportDto, ResolveReportDto } from './dto/report.dto.js';
import type { Report, ReportResolution } from './entities/report.entity.js';
import { ReportsRepository } from './reports.repository.js';

export interface ReportView {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: Role;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolution?: ReportResolution;
  createdAt: string;
}

export interface ReportDetailView {
  report: ReportView;
  target: unknown;
  messages?: MessageView[];
}

const REASON_LABELS: Record<ReportReason, string> = {
  offensive: 'Conteúdo ofensivo',
  false_info: 'Informação falsa',
  fraud: 'Golpe ou fraude',
  service_not_done: 'Serviço não realizado',
  other: 'Outro',
};

const ALLOWED_TARGETS: Record<'producer' | 'provider', ReportTargetType[]> = {
  producer: ['service', 'user', 'request'],
  provider: ['review', 'user', 'request'],
};

const ALLOWED_ACTIONS: Record<ReportTargetType, ReportResolutionAction[]> = {
  service: ['hide_service', 'warn', 'suspend', 'archive'],
  review: ['hide_review', 'warn', 'suspend', 'archive'],
  user: ['warn', 'suspend', 'archive'],
  request: ['warn', 'suspend', 'archive'],
};

const NEEDS_MESSAGE: ReportResolutionAction[] = ['hide_service', 'warn', 'suspend'];

function toReportView(report: Report, withResolution: boolean): ReportView {
  // Converte a entidade no tipo Report; a resolução só vai para administradores
  const { id, reporterId, reporterName, reporterRole, targetType, targetId, targetLabel, reason, description, status, createdAt } = report;
  const resolution = withResolution && report.resolution ? { resolution: report.resolution } : {};
  return { id, reporterId, reporterName, reporterRole, targetType, targetId, targetLabel, reason, description, status, ...resolution, createdAt };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly requests: RequestsRepository,
    private readonly services: ServicesRepository,
    private readonly catalog: CatalogService,
    private readonly reviews: ReviewsService,
    private readonly lifecycle: RequestLifecycleService,
    private readonly messages: MessagesService,
    private readonly adminUsers: AdminUsersService,
    private readonly adminServices: AdminServicesService,
    private readonly actions: AdminActionsService,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  async create(reporter: User, dto: CreateReportDto): Promise<ReportView> {
    // Cada papel só denuncia os tipos de alvo permitidos
    const role = reporter.role as 'producer' | 'provider';
    if (!ALLOWED_TARGETS[role].includes(dto.targetType)) this.notAllowed();
    const targetLabel = await this.resolveLabel(reporter, dto);

    // Uma denúncia aberta por alvo para cada usuário
    if (await this.reports.hasOpenFrom(reporter.id, dto.targetType, dto.targetId)) {
      throw conflict('Você já denunciou este item. Aguarde a análise.');
    }
    const report = await this.reports.create({
      reporterId: reporter.id,
      reporterName: reporter.name,
      reporterRole: reporter.role,
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetLabel,
      reason: dto.reason,
      description: dto.description,
      status: 'open',
      resolution: null,
      createdAt: this.clock.nowIso(),
    });

    // Avisa todos os administradores
    await this.notifications.notifyAdmins({
      type: 'report_created',
      title: `Nova denúncia: ${REASON_LABELS[dto.reason]}`,
      link: '/admin/denuncias',
    });
    return toReportView(report, false);
  }

  async list(query: Record<string, unknown>): Promise<Paginated<ReportView>> {
    // Fila do administrador: abertas por padrão, com filtro por tipo de alvo
    const page = parsePage(query, 20, 100);
    const known = REPORT_STATUSES.includes(query.status as ReportStatus) ? (query.status as ReportStatus) : 'open';
    const status = query.status === 'all' ? undefined : known;
    const targetType = REPORT_TARGET_TYPES.includes(query.targetType as ReportTargetType)
      ? (query.targetType as ReportTargetType)
      : undefined;
    const [reports, total] = await this.reports.findPage({ status, targetType }, page);
    return paginate(reports.map((report) => toReportView(report, true)), total, page);
  }

  async detail(id: string): Promise<ReportDetailView> {
    // Mostra o estado atual do alvo, mesmo oculto ou excluído
    const report = await this.load(id);
    const view = toReportView(report, true);
    if (report.targetType === 'request') {
      const target = await this.lifecycle.detail(report.targetId, 'admin');
      return { report: view, target, messages: await this.messages.listForAdmin(report.targetId) };
    }
    return { report: view, target: await this.currentTarget(report) };
  }

  async resolve(admin: User, id: string, dto: ResolveReportDto): Promise<ReportView> {
    // Só denúncias abertas, com ação permitida para o tipo de alvo
    const report = await this.load(id);
    if (report.status !== 'open') throw invalidTransition('Esta denúncia já foi analisada.');
    if (!ALLOWED_ACTIONS[report.targetType].includes(dto.action)) throw validationError({ action: ACTION_MESSAGE });
    if (NEEDS_MESSAGE.includes(dto.action) && !dto.message) throw validationError({ message: USER_MESSAGE });

    // Aplica o efeito da ação sobre o alvo ou sobre o usuário afetado
    const targetUserId = await this.applyAction(admin, report, dto);

    // Guarda a resolução; a nota interna nunca sai para os usuários
    report.status = dto.action === 'archive' ? 'dismissed' : 'resolved';
    report.resolution = {
      action: dto.action,
      ...(targetUserId ? { targetUserId } : {}),
      ...(dto.message ? { message: dto.message } : {}),
      internalNote: dto.internalNote,
      adminId: admin.id,
      adminName: admin.name,
      resolvedAt: this.clock.nowIso(),
    };
    const saved = await this.reports.save(report);

    // Quem denunciou é avisado, sem detalhes da ação
    await this.notifications.notify({
      userId: report.reporterId,
      type: 'report_resolved',
      title: 'Sua denúncia foi analisada.',
      link: notificationsLink(report.reporterRole),
    });
    const type = dto.action === 'archive' ? 'dismiss_report' : 'resolve_report';
    await this.actions.log(admin, type, { type: 'report', id: report.id, label: report.targetLabel }, dto.internalNote);
    return toReportView(saved, true);
  }

  private async applyAction(admin: User, report: Report, dto: ResolveReportDto): Promise<string | undefined> {
    // Arquivar não tem efeito sobre o alvo
    if (dto.action === 'archive') return undefined;
    const message = dto.message ?? '';

    // Ocultar anúncio ou avaliação age direto sobre o alvo
    if (dto.action === 'hide_service') {
      await this.adminServices.hide(admin, report.targetId, message);
      return undefined;
    }
    if (dto.action === 'hide_review') {
      const review = await this.reviews.findOrFail(report.targetId);
      await this.reviews.hide(review);
      await this.actions.log(admin, 'hide_review', { type: 'review', id: review.id, label: report.targetLabel });
      return undefined;
    }

    // Advertir e suspender agem sobre o usuário afetado
    const user = await this.adminUsers.findAny(await this.affectedUserId(report, dto));
    if (dto.action === 'suspend') {
      await this.adminUsers.suspend(admin, user.id, message);
      return user.id;
    }
    await this.notifications.notify({
      userId: user.id,
      type: 'warning',
      title: 'Aviso da administração',
      body: message,
      link: notificationsLink(user.role),
    });
    await this.actions.log(admin, 'warn_user', { type: 'user', id: user.id, label: user.name }, message);
    return user.id;
  }

  private async affectedUserId(report: Report, dto: ResolveReportDto): Promise<string> {
    // Anúncio → prestador; avaliação → autor; usuário → o próprio denunciado
    if (report.targetType === 'user') return report.targetId;
    if (report.targetType === 'service') {
      const service = await this.services.findByIdWithDeleted(report.targetId);
      if (!service) throw notFound('service_not_found', 'Serviço não encontrado.');
      return service.providerId;
    }
    if (report.targetType === 'review') return (await this.reviews.findOrFail(report.targetId)).producerId;

    // Solicitação: o administrador escolhe o produtor ou o prestador
    const request = await this.lifecycle.load(report.targetId);
    if (!dto.targetUserId || ![request.producerId, request.providerId].includes(dto.targetUserId)) {
      throw validationError({ targetUserId: 'Escolha o produtor ou o prestador da solicitação.' });
    }
    return dto.targetUserId;
  }

  private async currentTarget(report: Report): Promise<unknown> {
    // Carrega o alvo no formato do contrato, conforme o tipo
    if (report.targetType === 'service') {
      const service = await this.services.findByIdWithDeleted(report.targetId);
      return service ? toServiceView(service, true) : null;
    }
    if (report.targetType === 'review') return toReviewView(await this.reviews.findOrFail(report.targetId));
    return toUserView(await this.adminUsers.findAny(report.targetId));
  }

  private async resolveLabel(reporter: User, dto: CreateReportDto): Promise<string> {
    // Anúncio: qualquer um visível no catálogo
    if (dto.targetType === 'service') return (await this.catalog.findVisible(dto.targetId)).title;

    // Avaliação: só as recebidas pelo prestador
    if (dto.targetType === 'review') {
      const review = await this.reviews.findOrFail(dto.targetId);
      if (review.providerId !== reporter.id) this.notAllowed();
      return `Avaliação de ${review.producerName} · ${review.serviceTitle}`;
    }

    // Solicitação: só as próprias (produtor) ou as recebidas (prestador)
    if (dto.targetType === 'request') {
      const request = await this.lifecycle.load(dto.targetId, { role: reporter.role, id: reporter.id });
      return `Solicitação ${request.id} · ${request.serviceTitle}`;
    }

    // Usuário: a outra parte de alguma solicitação, atual ou antiga
    const target = await this.adminUsers.findAny(dto.targetId);
    const producerId = reporter.role === 'producer' ? reporter.id : target.id;
    const providerId = reporter.role === 'producer' ? target.id : reporter.id;
    const opposite = target.role !== reporter.role && target.role !== 'admin';
    if (!opposite || !(await this.requests.hasRelationship(producerId, providerId))) this.notAllowed();
    return target.name;
  }

  private notAllowed(): never {
    // Alvo fora do que o papel pode denunciar
    throw validationError({ targetType: NOT_ALLOWED_MESSAGE });
  }

  private async load(id: string): Promise<Report> {
    // Denúncia inexistente responde 404
    const report = await this.reports.findById(id);
    if (!report) throw notFound('report_not_found', 'Denúncia não encontrada.');
    return report;
  }
}
