import { Injectable } from '@nestjs/common';
import { notFound } from '../common/app.exception.js';
import { EquipmentView, toEquipmentView } from '../equipment/equipment.presenter.js';
import { EquipmentRepository } from '../equipment/equipment.repository.js';
import type { ReviewSummaryView, ReviewView } from '../reviews/review.presenter.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { ServiceView, toServiceView } from '../services/service.presenter.js';
import { ServicesRepository } from '../services/services.repository.js';
import { ProviderProfilesRepository } from './provider-profiles.repository.js';
import { ProviderView, toProviderView } from './provider.presenter.js';

export interface ProviderPublicProfileView {
  provider: ProviderView;
  services: ServiceView[];
  equipment: EquipmentView[];
  recentReviews: ReviewView[];
  reviewSummary: ReviewSummaryView;
}

@Injectable()
export class PublicProvidersService {
  constructor(
    private readonly profiles: ProviderProfilesRepository,
    private readonly services: ServicesRepository,
    private readonly equipment: EquipmentRepository,
    private readonly reviews: ReviewsService,
  ) {}

  async profile(id: string): Promise<ProviderPublicProfileView> {
    // Só prestadores ativos têm perfil público
    const profile = await this.profiles.findWithUser(id);
    if (!profile?.user || profile.user.role !== 'provider' || profile.user.status !== 'active') {
      throw notFound('provider_unavailable', 'Prestador não está mais na plataforma.');
    }

    // Serviços visíveis, equipamentos e as 5 avaliações mais recentes
    const services = await this.services.findVisibleByProvider(id);
    const equipment = await this.equipment.findByProvider(id);
    return {
      provider: toProviderView(profile.user, profile),
      services: services.map((service) => toServiceView(service)),
      equipment: equipment.map(toEquipmentView),
      recentReviews: await this.reviews.recentForProvider(id, 5),
      reviewSummary: await this.reviews.summaryForProvider(id),
    };
  }
}
