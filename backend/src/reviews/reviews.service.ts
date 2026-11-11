import { Injectable, OnModuleInit } from '@nestjs/common';
import { conflict, invalidTransition, notFound } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { Paginated, paginate, parsePage } from '../common/pagination.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProviderProfilesRepository } from '../providers/provider-profiles.repository.js';
import { RequestLifecycleService } from '../requests/request-lifecycle.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { ServicesRepository } from '../services/services.repository.js';
import type { User } from '../users/entities/user.entity.js';
import type { CreateReviewDto, ReplyReviewDto, UpdateReviewDto } from './dto/review.dto.js';
import type { Review } from './entities/review.entity.js';
import { addRating, changeRating, RatingTotals, removeRating, roundRating } from './ratings.js';
import { ReviewSummaryView, ReviewView, toReviewSummary, toReviewView } from './review.presenter.js';
import { ReviewsRepository } from './reviews.repository.js';

export type ReviewPage = Paginated<ReviewView> & { summary: ReviewSummaryView };

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    private readonly reviews: ReviewsRepository,
    private readonly services: ServicesRepository,
    private readonly profiles: ProviderProfilesRepository,
    private readonly catalog: CatalogService,
    private readonly lifecycle: RequestLifecycleService,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  onModuleInit(): void {
    // Ensina o detalhe da solicitação a carregar a avaliação
    this.lifecycle.useReviewLoader(async (request) => {
      const review = request.reviewId ? await this.reviews.findById(request.reviewId) : null;
      return review ? { view: toReviewView(review), editableUntil: review.editableUntil } : null;
    });
  }

  async create(producer: User, requestId: string, dto: CreateReviewDto): Promise<ReviewView> {
    // Só solicitação concluída, e uma única vez
    const request = await this.lifecycle.load(requestId, { role: 'producer', id: producer.id });
    if (request.status !== 'completed') throw invalidTransition();
    if (request.reviewId) throw conflict('Você já avaliou esta solicitação.');

    // A avaliação fica editável por 7 dias
    const now = this.clock.nowIso();
    const review = await this.reviews.create({
      requestId: request.id,
      serviceId: request.serviceId,
      serviceTitle: request.serviceTitle,
      providerId: request.providerId,
      producerId: producer.id,
      producerName: producer.name,
      rating: dto.rating,
      comment: dto.comment || null,
      hidden: false,
      editableUntil: this.clock.isoFromNow(EDIT_WINDOW_MS),
      createdAt: now,
      updatedAt: now,
    });

    // Liga a avaliação à solicitação, atualiza as médias e avisa o prestador
    await this.lifecycle.attachReview(request.id, review.id);
    await this.adjustAverages(review, (totals) => addRating(totals, dto.rating));
    await this.notifications.notify({
      userId: request.providerId,
      type: 'review',
      title: `Você recebeu uma avaliação de ${dto.rating} estrelas`,
      link: '/prestador/avaliacoes',
    });
    return toReviewView((await this.reviews.findById(review.id))!);
  }

  async update(producer: User, id: string, dto: UpdateReviewDto): Promise<ReviewView> {
    // Só o autor edita, e só dentro do prazo
    const review = await this.reviews.findById(id);
    if (!review || review.producerId !== producer.id) throw this.missing();
    if (this.clock.nowIso() > review.editableUntil) {
      throw conflict('O prazo para editar esta avaliação terminou.');
    }

    // Mudança de nota ajusta as médias, salvo em avaliação oculta
    const previous = review.rating;
    const next = dto.rating ?? previous;
    if (next !== previous && !review.hidden) {
      await this.adjustAverages(review, (totals) => changeRating(totals, previous, next));
    }
    const comment = dto.comment === undefined ? undefined : dto.comment || null;
    const updated = await this.reviews.update(id, { rating: next, comment, updatedAt: this.clock.nowIso() });
    return toReviewView(updated);
  }

  async listForService(serviceId: string, query: Record<string, unknown>, viewer?: User): Promise<ReviewPage> {
    // Mesma regra de acesso do detalhe do serviço; ocultas não aparecem
    const service = await this.catalog.findForViewer(serviceId, viewer);
    const page = parsePage(query, 10, 50);
    const scope = { serviceId };
    const [reviews, total] = await this.reviews.findPage(scope, { rating: this.ratingFilter(query), includeHidden: false }, page);
    const summary = toReviewSummary(this.official(service), await this.reviews.distribution(scope));
    return { ...paginate(reviews.map(toReviewView), total, page), summary };
  }

  async listForProvider(providerId: string, query: Record<string, unknown>): Promise<ReviewPage> {
    // O prestador vê também as ocultas, marcadas com hidden
    const page = parsePage(query, 10, 50);
    const scope = { providerId };
    const [reviews, total] = await this.reviews.findPage(scope, { rating: this.ratingFilter(query), includeHidden: true }, page);
    const profile = await this.profiles.findByUserId(providerId);
    const summary = toReviewSummary(this.official(profile), await this.reviews.distribution(scope));
    return { ...paginate(reviews.map(toReviewView), total, page), summary };
  }

  async summaryForProvider(providerId: string): Promise<ReviewSummaryView> {
    // Resumo usado no perfil público do prestador
    const profile = await this.profiles.findByUserId(providerId);
    return toReviewSummary(this.official(profile), await this.reviews.distribution({ providerId }));
  }

  async recentForProvider(providerId: string, limit: number): Promise<ReviewView[]> {
    // Avaliações visíveis mais recentes do prestador
    const page = { page: 1, pageSize: limit, skip: 0 };
    const [reviews] = await this.reviews.findPage({ providerId }, { includeHidden: false }, page);
    return reviews.map(toReviewView);
  }

  async reply(provider: User, id: string, dto: ReplyReviewDto): Promise<ReviewView> {
    // Só o prestador avaliado responde, uma resposta por avaliação
    const review = await this.reviews.findById(id);
    if (!review || review.providerId !== provider.id) throw this.missing();
    const now = this.clock.nowIso();
    const first = !review.replyText;
    const updated = await this.reviews.update(id, {
      replyText: dto.text,
      replyCreatedAt: review.replyCreatedAt ?? now,
      replyUpdatedAt: now,
    });

    // Só a primeira resposta notifica o produtor
    if (first) {
      await this.notifications.notify({
        userId: review.producerId,
        type: 'review_reply',
        title: `${provider.name} respondeu à sua avaliação`,
        link: `/servicos/${review.serviceId}`,
      });
    }
    return toReviewView(updated);
  }

  async hide(review: Review): Promise<void> {
    // Ocultar tira a nota das médias do serviço e do prestador
    if (review.hidden) return;
    await this.reviews.update(review.id, { hidden: true });
    await this.adjustAverages(review, (totals) => removeRating(totals, review.rating));
  }

  async findOrFail(id: string): Promise<Review> {
    // Usado pelas denúncias para localizar o alvo
    const review = await this.reviews.findById(id);
    if (!review) throw this.missing();
    return review;
  }

  private async adjustAverages(review: Review, change: (totals: RatingTotals) => RatingTotals): Promise<void> {
    // Aplica a mesma fórmula ao serviço e ao perfil do prestador
    const service = await this.services.findByIdWithDeleted(review.serviceId);
    if (service) await this.services.update(service.id, change(service));
    const profile = await this.profiles.findByUserId(review.providerId);
    if (profile) await this.profiles.update(profile.userId, change(profile));
  }

  private official(totals: RatingTotals | null): RatingTotals {
    // Números oficiais exibidos no resumo
    return { rating: roundRating(totals?.rating ?? 0), reviewCount: totals?.reviewCount ?? 0 };
  }

  private ratingFilter(query: Record<string, unknown>): number | undefined {
    // Filtro por nota; valor inválido é ignorado
    const rating = Number(query.rating);
    return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : undefined;
  }

  private missing() {
    // Avaliação inexistente ou de outra pessoa
    return notFound('review_not_found', 'Avaliação não encontrada.');
  }
}
