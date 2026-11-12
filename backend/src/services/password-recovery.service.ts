import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validationError } from '../exceptions/app.exception.js';
import { ClockService } from './clock.service.js';
import { MailService } from './mail.service.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AuthService } from './auth.service.js';
import { INVALID_LINK_MESSAGE } from '../dto/password-recovery.dto.js';
import type { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-recovery.dto.js';
import { PasswordResetTokensRepository } from '../repositories/password-reset-tokens.repository.js';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

export interface ForgotPasswordView {
  message: string;
}

function hashToken(token: string): string {
  // O banco guarda só o hash, nunca o token em si
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: PasswordResetTokensRepository,
    private readonly auth: AuthService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
  ) {}

  async forgot(dto: ForgotPasswordDto): Promise<ForgotPasswordView> {
    // A resposta é sempre a mesma, exista ou não a conta
    const response: ForgotPasswordView = { message: 'Se o e-mail existir, enviaremos um link.' };
    const email = typeof dto.email === 'string' ? dto.email.toLowerCase() : '';
    const user = email ? await this.users.findByEmail(email) : null;
    if (!user || user.status !== 'active') return response;

    // No máximo 3 pedidos por conta por hora
    const since = this.clock.isoFromNow(-REQUEST_WINDOW_MS);
    if ((await this.tokens.countSince(user.id, since)) >= MAX_REQUESTS_PER_WINDOW) return response;

    // Gera um token de uso único e invalida os anteriores
    const token = randomBytes(32).toString('hex');
    const now = this.clock.nowIso();
    await this.tokens.invalidateAll(user.id, now);
    await this.tokens.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: this.clock.isoFromNow(TOKEN_TTL_MS),
      createdAt: now,
    });

    // Envia o e-mail sem esperar, para a resposta não revelar se a conta existe
    const frontendUrl = this.config.getOrThrow<string>('frontendUrl');
    void this.mail.sendPasswordReset(user.email, user.name, `${frontendUrl}/redefinir-senha?token=${token}`);
    return response;
  }

  async reset(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Token inexistente, vencido ou já usado recebe a mesma mensagem
    const record = await this.tokens.findByHash(hashToken(dto.token));
    const now = this.clock.nowIso();
    if (!record || record.usedAt || record.expiresAt <= now) {
      throw validationError({ token: INVALID_LINK_MESSAGE });
    }

    // Troca a senha e queima todos os links da conta
    const passwordHash = await this.auth.hashPassword(dto.password);
    await this.users.update(record.userId, { passwordHash, mustChangePassword: false });
    await this.tokens.invalidateAll(record.userId, now);
    return { message: 'Senha redefinida. Entre com a nova senha.' };
  }
}
