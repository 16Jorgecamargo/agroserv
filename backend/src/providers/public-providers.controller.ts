import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/auth.decorators.js';
import { ProviderPublicProfileView, PublicProvidersService } from './public-providers.service.js';

@Public()
@Controller('providers')
export class PublicProvidersController {
  constructor(private readonly providers: PublicProvidersService) {}

  @Get(':id')
  profile(@Param('id') id: string): Promise<ProviderPublicProfileView> {
    // Perfil público do prestador
    return this.providers.profile(id);
  }
}
