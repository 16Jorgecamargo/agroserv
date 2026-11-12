import type { UploadPurpose } from '../types/index.js';
import type { Upload } from '../entities/upload.entity.js';

export interface UploadView {
  id: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
  purpose: UploadPurpose;
  createdAt: string;
}

export function toUploadView(upload: Upload, url = upload.url): UploadView {
  // Converte a entidade no tipo Upload do contrato
  return {
    id: upload.id,
    url,
    name: upload.name,
    contentType: upload.contentType,
    size: upload.size,
    purpose: upload.purpose,
    createdAt: upload.createdAt,
  };
}
