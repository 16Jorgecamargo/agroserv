import { Module } from '@nestjs/common';
import { ProviderProfileController } from './provider-profile.controller.js';
import { ProviderProfileService } from './provider-profile.service.js';
import { VerificationController } from './verification.controller.js';
import { VerificationService } from './verification.service.js';

@Module({
  controllers: [ProviderProfileController, VerificationController],
  providers: [ProviderProfileService, VerificationService],
  exports: [ProviderProfileService, VerificationService],
})
export class ProvidersModule {}
