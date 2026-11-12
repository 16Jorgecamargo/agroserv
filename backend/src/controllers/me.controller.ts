import { Body, Controller, Delete, Patch } from '@nestjs/common';
import { CurrentUser } from '../decorators/auth.decorators.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import { UpdateMeDto } from '../dto/update-me.dto.js';
import type { User } from '../entities/user.entity.js';
import type { UserView } from '../presenters/user.presenter.js';
import { UsersService } from '../services/users.service.js';

@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  update(@CurrentUser() user: User, @Body() dto: UpdateMeDto): Promise<UserView> {
    // Edita os dados pessoais
    return this.users.updateMe(user, dto);
  }

  @Patch('password')
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Troca a senha pedindo a atual
    return this.users.changePassword(user, dto);
  }

  @Delete()
  remove(@CurrentUser() user: User): Promise<{ message: string }> {
    // Exclui a própria conta
    return this.users.deleteMe(user);
  }
}
