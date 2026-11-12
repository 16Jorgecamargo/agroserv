import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { SubmitVerificationDto } from '../dto/verification.dto.js';
import { VerificationService, VerificationView } from '../services/verification.service.js';

@Roles('provider')
@Controller('provider/verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  get(@CurrentUser() user: User): Promise<VerificationView> {
    // Situação da verificação do prestador
    return this.verification.getOwn(user.id);
  }

  @Post()
  @HttpCode(200)
  submit(@CurrentUser() user: User, @Body() dto: SubmitVerificationDto): Promise<VerificationView> {
    // Envia os documentos para análise
    return this.verification.submit(user, dto);
  }
}
