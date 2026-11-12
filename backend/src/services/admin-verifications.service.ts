import { Injectable } from '@nestjs/common';
import { invalidTransition, notFound } from '../exceptions/app.exception.js';
import { ClockService } from './clock.service.js';
import { NotificationsService } from './notifications.service.js';
import type { ProviderProfile } from '../entities/provider-profile.entity.js';
import { ProviderProfilesRepository } from '../repositories/provider-profiles.repository.js';
import { ProviderView, toProviderView } from '../presenters/provider.presenter.js';
import { VerificationService, VerificationView } from './verification.service.js';
import type { User } from '../entities/user.entity.js';
import { AdminActionsService } from './admin-actions.service.js';

export interface PendingVerificationView {
  provider: ProviderView;
  email: string;
  document: string;
  verification: VerificationView;
}

@Injectable()
export class AdminVerificationsService {
  constructor(
    private readonly profiles: ProviderProfilesRepository,
    private readonly verification: VerificationService,
    private readonly notifications: NotificationsService,
    private readonly actions: AdminActionsService,
    private readonly clock: ClockService,
  ) {}

  async queue(): Promise<PendingVerificationView[]> {
    // Fila de análise, enviados há mais tempo primeiro
    const profiles = await this.profiles.findUnderReview();
    const items: PendingVerificationView[] = [];
    for (const profile of profiles) {
      items.push({
        provider: toProviderView(profile.user!, profile),
        email: profile.user!.email,
        document: profile.document,
        verification: await this.verification.toView(profile),
      });
    }
    return items;
  }

  async approve(admin: User, providerId: string): Promise<VerificationView> {
    // Aprovar dá o selo de verificado na hora
    const profile = await this.loadUnderReview(providerId);
    const updated = await this.profiles.update(providerId, {
      verificationStatus: 'approved',
      verificationRejectionReason: null,
      verificationReviewedAt: this.clock.nowIso(),
    });
    await this.notifications.notify({
      userId: providerId,
      type: 'verification',
      title: 'Sua verificação foi aprovada.',
      link: '/prestador/verificacao',
    });
    await this.actions.log(admin, 'approve_verification', this.target(profile));
    return this.verification.toView(updated);
  }

  async reject(admin: User, providerId: string, reason: string): Promise<VerificationView> {
    // Rejeitar guarda o motivo; o prestador pode corrigir e reenviar
    const profile = await this.loadUnderReview(providerId);
    const updated = await this.profiles.update(providerId, {
      verificationStatus: 'rejected',
      verificationRejectionReason: reason,
      verificationReviewedAt: this.clock.nowIso(),
    });
    await this.notifications.notify({
      userId: providerId,
      type: 'verification',
      title: 'Sua verificação foi rejeitada',
      body: reason,
      link: '/prestador/verificacao',
    });
    await this.actions.log(admin, 'reject_verification', this.target(profile), reason);
    return this.verification.toView(updated);
  }

  private target(profile: ProviderProfile) {
    // Alvo da ação no histórico administrativo
    return { type: 'verification' as const, id: profile.userId, label: profile.user?.name ?? profile.userId };
  }

  private async loadUnderReview(providerId: string): Promise<ProviderProfile> {
    // Só verificações em análise podem ser decididas
    const profile = await this.profiles.findWithUser(providerId);
    if (!profile) throw notFound('user_not_found', 'Usuário não encontrado.');
    if (profile.verificationStatus !== 'under_review') {
      throw invalidTransition('Esta verificação não está em análise.');
    }
    return profile;
  }
}
