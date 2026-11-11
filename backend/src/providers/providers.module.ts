import { Module } from '@nestjs/common';
import { ProviderProfileController } from './provider-profile.controller.js';
import { ProviderProfileService } from './provider-profile.service.js';

@Module({
  controllers: [ProviderProfileController],
  providers: [ProviderProfileService],
  exports: [ProviderProfileService],
})
export class ProvidersModule {}
