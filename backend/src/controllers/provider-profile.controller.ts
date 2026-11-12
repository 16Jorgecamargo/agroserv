import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { UpdateProviderProfileDto } from '../dto/update-provider-profile.dto.js';
import { ProviderProfileService } from '../services/provider-profile.service.js';
import type { ProviderProfileView } from '../presenters/provider.presenter.js';

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
