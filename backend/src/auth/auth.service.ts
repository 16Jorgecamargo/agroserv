import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { AppException, badRequest, forbidden, unauthorized, validationError } from '../common/app.exception.js';
import type { JwtPayload } from '../common/auth.guard.js';
import { ClockService } from '../common/clock.service.js';
import { normalizeText, onlyDigits } from '../common/text.js';
import { ProviderProfilesRepository } from '../providers/provider-profiles.repository.js';
import type { User } from '../users/entities/user.entity.js';
import { toUserView, UserView } from '../users/user.presenter.js';
import { UsersRepository } from '../users/users.repository.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { LoginAttemptsRepository } from './login-attempts.repository.js';

export interface SessionView {
  token: string;
  user: UserView;
}

const MAX_FAILED_LOGINS = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly profiles: ProviderProfilesRepository,
    private readonly attempts: LoginAttemptsRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
  ) {}

  hashPassword(password: string): Promise<string> {
    // Gera o hash da senha com o custo configurado
    return bcrypt.hash(password, this.config.getOrThrow<number>('bcryptRounds'));
  }

  async register(dto: RegisterDto): Promise<SessionView> {
    // O e-mail é único entre as contas não excluídas
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw validationError({ email: 'Este e-mail já está cadastrado.' });
    }

    // Cria a conta com a senha em hash e a data do aceite dos termos
    const now = this.clock.nowIso();
    const user = await this.users.create({
      name: dto.name,
      email,
      passwordHash: await this.hashPassword(dto.password),
      role: dto.role,
      phone: onlyDigits(dto.phone),
      city: dto.city,
      state: dto.state,
      status: 'active',
      searchText: normalizeText(`${dto.name} ${email}`),
      termsAcceptedAt: now,
      createdAt: now,
    });

    // Prestador já nasce com o perfil profissional vazio
    if (user.role === 'provider') await this.profiles.create(user.id);
    return this.openSession(user);
  }

  async login(dto: LoginDto): Promise<SessionView> {
    // Os dois campos são obrigatórios
    const { email: rawEmail, password } = dto;
    if (typeof rawEmail !== 'string' || typeof password !== 'string' || !rawEmail || !password) {
      throw badRequest('validation_error', 'Informe e-mail e senha.');
    }

    // Bloqueia depois de 5 tentativas erradas em 15 minutos
    const email = rawEmail.toLowerCase();
    const since = this.clock.isoFromNow(-FAILED_LOGIN_WINDOW_MS);
    if ((await this.attempts.countSince(email, since)) >= MAX_FAILED_LOGINS) {
      throw new AppException(429, 'too_many_attempts', 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    }

    // Credenciais erradas e conta excluída recebem a mesma resposta genérica
    const user = await this.users.findByEmail(email);
    const hash = user ? await this.users.findPasswordHash(user.id) : null;
    if (!user || !hash || !(await bcrypt.compare(password, hash))) {
      await this.attempts.register(email, this.clock.nowIso());
      throw unauthorized('E-mail ou senha inválidos.', 'invalid_credentials');
    }

    // Conta suspensa só é avisada quando a senha está correta
    if (user.status === 'suspended') {
      throw forbidden('Sua conta está suspensa. Entre em contato com o suporte.', 'account_suspended');
    }
    await this.attempts.clear(email);
    return this.openSession(user);
  }

  me(user: User): UserView {
    // Devolve os dados da conta autenticada
    return toUserView(user);
  }

  private async openSession(user: User): Promise<SessionView> {
    // Assina o token com o payload mínimo
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.signAsync(payload);
    return { token, user: toUserView(user) };
  }
}
