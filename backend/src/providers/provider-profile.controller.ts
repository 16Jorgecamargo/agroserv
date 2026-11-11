import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';
import { ProviderProfileService } from './provider-profile.service.js';
import type { ProviderProfileView } from './provider.presenter.js';

@Roles('provider')
@Controller('provider/profile')
export class ProviderProfileController {
  constructor(private readonly profiles: ProviderProfileService) {}

  @Get()
  get(@CurrentUser() user: User): Promise<ProviderProfileView> {
    // Perfil profissional do prestador
    return this.profiles.getOwn(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: User,
    @Body() dto: UpdateProviderProfileDto,
  ): Promise<ProviderProfileView> {
    // Edita documento, raio, experiência e descrição
    return this.profiles.updateOwn(user.id, dto);
  }
}
