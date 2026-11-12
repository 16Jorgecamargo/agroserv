import { Injectable } from '@nestjs/common';
import { notFound } from '../exceptions/app.exception.js';
import { onlyDigits } from '../utils/text.js';
import type { UpdateProviderProfileDto } from '../dto/update-provider-profile.dto.js';
import type { ProviderProfile } from '../entities/provider-profile.entity.js';
import { ProviderProfilesRepository } from '../repositories/provider-profiles.repository.js';
import { ProviderProfileView, toProviderProfileView } from '../presenters/provider.presenter.js';

@Injectable()
export class ProviderProfileService {
  constructor(private readonly profiles: ProviderProfilesRepository) {}

  async getOwn(userId: string): Promise<ProviderProfileView> {
    // Perfil profissional do prestador autenticado
    return toProviderProfileView(await this.load(userId));
  }

  async updateOwn(userId: string, dto: UpdateProviderProfileDto): Promise<ProviderProfileView> {
    // Copia só os campos enviados
    const profile = await this.load(userId);
    const { document: rawDocument, ...fields } = dto;
    const changes: Partial<ProviderProfile> = { ...fields };

    // Trocar o documento derruba a verificação aprovada ou em análise
    if (rawDocument !== undefined) {
      const document = onlyDigits(rawDocument);
      const locked = ['approved', 'under_review'].includes(profile.verificationStatus);
      if (document !== profile.document && locked) {
        Object.assign(changes, {
          verificationStatus: 'not_sent',
          verificationRejectionReason: null,
          identityUploadId: null,
          addressUploadId: null,
          verificationSubmittedAt: null,
          verificationReviewedAt: null,
        });
      }
      changes.document = document;
    }
    return toProviderProfileView(await this.profiles.update(userId, changes));
  }

  private async load(userId: string): Promise<ProviderProfile> {
    // Todo prestador tem perfil; a falta dele é tratada como conta inválida
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw notFound('provider_unavailable', 'Prestador não está mais na plataforma.');
    return profile;
  }
}
