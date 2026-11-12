import { Injectable } from '@nestjs/common';
import { conflict, notFound, validationError } from '../exceptions/app.exception.js';
import { ClockService } from './clock.service.js';
import type { VerificationStatus } from '../types/index.js';
import { NotificationsService } from './notifications.service.js';
import { UploadRulesService } from './upload-rules.service.js';
import { UploadsRepository } from '../repositories/uploads.repository.js';
import type { User } from '../entities/user.entity.js';
import type { SubmitVerificationDto } from '../dto/verification.dto.js';
import type { ProviderProfile } from '../entities/provider-profile.entity.js';
import { ProviderProfilesRepository } from '../repositories/provider-profiles.repository.js';

export interface VerificationDocumentView {
  kind: 'identity' | 'address';
  uploadId: string;
  url: string;
  name: string;
}

export interface VerificationView {
  status: VerificationStatus;
  documents: VerificationDocumentView[];
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly profiles: ProviderProfilesRepository,
    private readonly uploads: UploadsRepository,
    private readonly uploadRules: UploadRulesService,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  async getOwn(providerId: string): Promise<VerificationView> {
    // Situação da verificação do prestador autenticado
    return this.toView(await this.load(providerId));
  }

  async submit(provider: User, dto: SubmitVerificationDto): Promise<VerificationView> {
    // Só envia quem ainda não enviou ou foi rejeitado
    const profile = await this.load(provider.id);
    if (['under_review', 'approved'].includes(profile.verificationStatus)) {
      throw conflict('Sua verificação já foi enviada.');
    }
    if (!profile.document) {
      throw validationError({ document: 'Preencha o CPF ou CNPJ no seu perfil antes de enviar.' });
    }

    // Os dois documentos precisam ser uploads de verificação do próprio prestador
    await this.assertDocument(provider.id, dto.identityUploadId, 'identityUploadId');
    await this.assertDocument(provider.id, dto.addressUploadId, 'addressUploadId');

    // Entra na fila de análise e avisa os administradores
    const updated = await this.profiles.update(provider.id, {
      verificationStatus: 'under_review',
      verificationRejectionReason: null,
      identityUploadId: dto.identityUploadId,
      addressUploadId: dto.addressUploadId,
      verificationSubmittedAt: this.clock.nowIso(),
      verificationReviewedAt: null,
    });
    await this.notifications.notifyAdmins({
      type: 'verification_submitted',
      title: `Nova verificação de ${provider.name}`,
      link: '/admin/verificacoes',
    });
    return this.toView(updated);
  }

  async toView(profile: ProviderProfile): Promise<VerificationView> {
    // Documentos saem com URL assinada, só para o dono e os administradores
    const kinds: ['identity' | 'address', string | null][] = [
      ['identity', profile.identityUploadId],
      ['address', profile.addressUploadId],
    ];
    const uploads = await this.uploads.findByIds(kinds.map(([, id]) => id).filter((id): id is string => !!id));
    const documents = kinds.flatMap(([kind, id]) => {
      const upload = uploads.find((item) => item.id === id);
      return upload ? [{ kind, uploadId: upload.id, url: this.uploadRules.signedUrl(upload), name: upload.name }] : [];
    });

    // Datas e motivo só aparecem quando existem
    const { verificationSubmittedAt: submittedAt, verificationReviewedAt: reviewedAt } = profile;
    const rejectionReason = profile.verificationRejectionReason;
    return {
      status: profile.verificationStatus,
      documents,
      ...(submittedAt ? { submittedAt } : {}),
      ...(reviewedAt ? { reviewedAt } : {}),
      ...(rejectionReason ? { rejectionReason } : {}),
    };
  }

  private async assertDocument(providerId: string, uploadId: string, field: string): Promise<void> {
    // Um upload público ou de outra pessoa não vale como documento
    const upload = await this.uploads.findById(uploadId);
    if (!upload || upload.userId !== providerId || upload.purpose !== 'verification') {
      throw validationError({ [field]: 'Envie o documento novamente.' });
    }
  }

  private async load(providerId: string): Promise<ProviderProfile> {
    // Todo prestador tem perfil profissional
    const profile = await this.profiles.findByUserId(providerId);
    if (!profile) throw notFound('provider_unavailable', 'Prestador não está mais na plataforma.');
    return profile;
  }
}
