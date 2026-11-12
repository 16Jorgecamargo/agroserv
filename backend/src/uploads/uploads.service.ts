import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { notFound, validationError } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { UPLOAD_PURPOSES } from '../common/types.js';
import type { UploadPurpose } from '../common/types.js';
import type { User } from '../users/entities/user.entity.js';
import type { Upload } from './entities/upload.entity.js';
import { UploadRulesService } from './upload-rules.service.js';
import { toUploadView, UploadView } from './upload.presenter.js';
import { UploadsRepository } from './uploads.repository.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export interface IncomingFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface OpenedFile {
  upload: Upload;
  file: StreamableFile;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly uploads: UploadsRepository,
    private readonly rules: UploadRulesService,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
  ) {}

  async create(user: User, file: IncomingFile | undefined, purpose: unknown): Promise<UploadView> {
    // Confere tipo, tamanho e finalidade do arquivo
    const extension = file ? EXTENSIONS[file.mimetype] : undefined;
    if (!file || !extension) {
      throw validationError({ file: 'Envie uma imagem JPG, PNG ou WEBP, ou um PDF.' });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw validationError({ file: 'O arquivo deve ter no máximo 5 MB.' });
    }
    const chosen = (purpose === undefined || purpose === '' ? 'public' : purpose) as UploadPurpose;
    if (!UPLOAD_PURPOSES.includes(chosen)) {
      throw validationError({ purpose: 'Finalidade do arquivo inválida.' });
    }

    // Grava o arquivo em disco com um nome gerado pela API
    const id = randomUUID();
    const fileName = `${id}.${extension}`;
    const directory = this.directory();
    mkdirSync(directory, { recursive: true });
    await writeFile(join(directory, fileName), file.buffer);

    // Registra o arquivo e devolve a URL para usar em outros endpoints
    const upload = await this.uploads.create({
      id,
      userId: user.id,
      url: `${this.config.getOrThrow<string>('publicUrl')}/uploads/${id}/file`,
      name: file.originalname.slice(0, 200) || fileName,
      contentType: file.mimetype,
      size: file.size,
      purpose: chosen,
      fileName,
      createdAt: this.clock.nowIso(),
    });
    return toUploadView(upload, this.rules.signedUrl(upload));
  }

  async open(id: string, viewer: User | undefined, token: unknown): Promise<OpenedFile> {
    // Documentos de verificação só abrem para o dono, administradores ou URL assinada
    const upload = await this.uploads.findById(id);
    const isOwnerOrAdmin = viewer && (viewer.id === upload?.userId || viewer.role === 'admin');
    const allowed =
      upload && (upload.purpose === 'public' || isOwnerOrAdmin || this.rules.canOpenWithToken(upload, token));
    const path = upload ? join(this.directory(), upload.fileName) : '';
    if (!upload || !allowed || !existsSync(path)) {
      throw notFound('upload_not_found', 'Arquivo não encontrado.');
    }

    // Entrega o conteúdo em fluxo, com o tipo original
    const file = new StreamableFile(createReadStream(path), {
      type: upload.contentType,
      disposition: 'inline',
      length: upload.size,
    });
    return { upload, file };
  }

  private directory(): string {
    // Pasta configurada para os arquivos enviados
    return resolve(this.config.getOrThrow<string>('uploadDir'));
  }
}
