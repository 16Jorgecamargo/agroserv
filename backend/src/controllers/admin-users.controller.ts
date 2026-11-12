import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../decorators/auth.decorators.js';
import type { Paginated } from '../utils/pagination.js';
import type { User } from '../entities/user.entity.js';
import type { UserView } from '../presenters/user.presenter.js';
import { AdminUserDetailView, AdminUsersService } from '../services/admin-users.service.js';
import { CreateAdminDto, ReasonDto } from '../dto/admin.dto.js';

@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<Paginated<UserView>> {
    // Lista as contas com busca e filtros
    return this.users.list(query);
  }

  @Post()
  create(@CurrentUser() admin: User, @Body() dto: CreateAdminDto): Promise<UserView> {
    // Cria outro administrador com senha provisória
    return this.users.createAdmin(admin, dto);
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<AdminUserDetailView> {
    // Detalhe de uma conta
    return this.users.detail(id);
  }

  @Post(':id/suspend')
  @HttpCode(200)
  suspend(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ReasonDto): Promise<UserView> {
    // Suspende a conta com motivo
    return this.users.suspend(admin, id, dto.reason);
  }

  @Post(':id/reactivate')
  @HttpCode(200)
  reactivate(@CurrentUser() admin: User, @Param('id') id: string): Promise<UserView> {
    // Devolve o acesso à conta
    return this.users.reactivate(admin, id);
  }
}
