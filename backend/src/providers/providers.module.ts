import { Module } from '@nestjs/common';
import { ProviderProfileController } from './provider-profile.controller.js';
import { ProviderProfileService } from './provider-profile.service.js';
import { PublicProvidersController } from './public-providers.controller.js';
import { PublicProvidersService } from './public-providers.service.js';
import { VerificationController } from './verification.controller.js';
import { VerificationService } from './verification.service.js';

@Module({
  controllers: [ProviderProfileController, VerificationController, PublicProvidersController],
  providers: [ProviderProfileService, VerificationService, PublicProvidersService],
  exports: [ProviderProfileService, VerificationService],
})
export class ProvidersModule {}
