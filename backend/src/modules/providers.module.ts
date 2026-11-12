import { Module } from '@nestjs/common';
import { ProviderProfileController } from '../controllers/provider-profile.controller.js';
import { ProviderProfileService } from '../services/provider-profile.service.js';
import { PublicProvidersController } from '../controllers/public-providers.controller.js';
import { PublicProvidersService } from '../services/public-providers.service.js';
import { VerificationController } from '../controllers/verification.controller.js';
import { VerificationService } from '../services/verification.service.js';

@Module({
  controllers: [ProviderProfileController, VerificationController, PublicProvidersController],
  providers: [ProviderProfileService, VerificationService, PublicProvidersService],
  exports: [ProviderProfileService, VerificationService],
})
export class ProvidersModule {}
