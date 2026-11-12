import {
  Body, Controller, Get, Header, Param, Post, Query, StreamableFile, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Public } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import type { UploadView } from '../presenters/upload.presenter.js';
import { MAX_UPLOAD_BYTES, UploadsService } from '../services/uploads.service.js';
import type { IncomingFile } from '../services/uploads.service.js';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: IncomingFile | undefined,
    @Body('purpose') purpose: unknown,
  ): Promise<UploadView> {
    // Recebe um arquivo em multipart/form-data
    return this.uploads.create(user, file, purpose);
  }

  @Public()
  @Get(':id/file')
  @Header('Cache-Control', 'private, max-age=300')
  async file(
    @Param('id') id: string,
    @CurrentUser() user: User | undefined,
    @Query('token') token: unknown,
  ): Promise<StreamableFile> {
    // Entrega o conteúdo do arquivo
    const opened = await this.uploads.open(id, user, token);
    return opened.file;
  }
}
