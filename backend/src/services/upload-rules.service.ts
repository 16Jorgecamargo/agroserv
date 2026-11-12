import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { validationError } from '../exceptions/app.exception.js';
import type { Upload } from '../entities/upload.entity.js';
import { UploadsRepository } from '../repositories/uploads.repository.js';

export interface FileTokenPayload {
  upload: string;
}

@Injectable()
export class UploadRulesService {
  constructor(
    private readonly uploads: UploadsRepository,
    private readonly jwt: JwtService,
  ) {}

  async assertOwnPublicUrls(userId: string, urls: string[], field: string): Promise<void> {
    // Só valem URLs de fotos enviadas pelo próprio usuário
    const found = await this.uploads.findByUrls(urls);
    const usable = new Set(
      found.filter((upload) => upload.userId === userId && upload.purpose === 'public').map((upload) => upload.url),
    );
    if (urls.some((url) => !usable.has(url))) {
      throw validationError({ [field]: 'Use apenas imagens enviadas por você.' });
    }
  }

  signedUrl(upload: Upload): string {
    // Documentos de verificação usam URL assinada de curta duração
    if (upload.purpose !== 'verification') return upload.url;
    const payload: FileTokenPayload = { upload: upload.id };
    return `${upload.url}?token=${this.jwt.sign(payload, { expiresIn: '10m' })}`;
  }

  canOpenWithToken(upload: Upload, token: unknown): boolean {
    // Confere a assinatura e se o token é deste arquivo
    if (typeof token !== 'string' || !token) return false;
    try {
      return this.jwt.verify<FileTokenPayload>(token).upload === upload.id;
    } catch {
      return false;
    }
  }
}
