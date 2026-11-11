import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service.js';
import { conflict, forbidden, validationError } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { normalizeText, onlyDigits } from '../common/text.js';
import { UploadRulesService } from '../uploads/upload-rules.service.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { UpdateMeDto } from './dto/update-me.dto.js';
import type { User } from './entities/user.entity.js';
import { toUserView, UserView } from './user.presenter.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly auth: AuthService,
    private readonly uploadRules: UploadRulesService,
    private readonly clock: ClockService,
  ) {}

  async updateMe(user: User, dto: UpdateMeDto): Promise<UserView> {
    // A foto precisa ser um upload público do próprio usuário
    if (dto.avatarUrl) await this.uploadRules.assertOwnPublicUrls(user.id, [dto.avatarUrl], 'avatarUrl');

    // Monta só os campos enviados e mantém o texto de busca em dia
    const changes: Partial<User> = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.phone !== undefined) changes.phone = onlyDigits(dto.phone);
    if (dto.city !== undefined) changes.city = dto.city;
    if (dto.state !== undefined) changes.state = dto.state;
    if (dto.avatarUrl !== undefined) changes.avatarUrl = dto.avatarUrl;
    if (changes.name) changes.searchText = normalizeText(`${changes.name} ${user.email}`);
    return toUserView(await this.users.update(user.id, changes));
  }

  async changePassword(user: User, dto: ChangePasswordDto): Promise<{ message: string }> {
    // Confere a senha atual antes de trocar
    const hash = await this.users.findPasswordHash(user.id);
    if (!hash || !(await bcrypt.compare(dto.currentPassword, hash))) {
      throw validationError({ currentPassword: 'Senha atual incorreta.' });
    }
    if (dto.currentPassword === dto.newPassword) {
      throw validationError({ newPassword: 'A nova senha precisa ser diferente da atual.' });
    }

    // Grava o novo hash e libera a conta com senha provisória
    const passwordHash = await this.auth.hashPassword(dto.newPassword);
    await this.users.update(user.id, { passwordHash, mustChangePassword: false });
    return { message: 'Senha alterada.' };
  }

  async deleteMe(user: User): Promise<{ message: string }> {
    // Administradores não se excluem
    if (user.role === 'admin') throw forbidden();

    // Conta com solicitação aberta não pode ser excluída
    if ((await this.users.countOpenRequests(user.id)) > 0) {
      throw conflict('Você tem solicitações em andamento. Conclua ou cancele antes de excluir a conta.');
    }
    await this.users.softDelete(user, this.clock.nowIso());
    return { message: 'Conta excluída.' };
  }
}
