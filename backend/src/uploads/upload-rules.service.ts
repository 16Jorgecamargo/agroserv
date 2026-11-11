import { Injectable } from '@nestjs/common';
import { validationError } from '../common/app.exception.js';
import { UploadsRepository } from './uploads.repository.js';

@Injectable()
export class UploadRulesService {
  constructor(private readonly uploads: UploadsRepository) {}

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
}
