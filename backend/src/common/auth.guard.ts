import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository.js';
import type { User } from '../users/entities/user.entity.js';
import { forbidden, unauthorized } from './app.exception.js';
import { AuthenticatedRequest, PUBLIC_KEY, ROLES_KEY } from './auth.decorators.js';
import type { Role } from './types.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Identifica o usuário pelo token, quando houver
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.resolveUser(request);
    if (user) request.user = user;

    // Rotas privadas exigem sessão válida de conta ativa
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets);
    if (!isPublic && !user) throw unauthorized();
    return true;
  }

  private async resolveUser(request: AuthenticatedRequest): Promise<User | null> {
    // Lê o token do header Authorization: Bearer
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    // Token inválido ou de conta suspensa/excluída não identifica ninguém
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.users.findById(payload.sub);
      return user?.status === 'active' ? user : null;
    } catch {
      return null;
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Sem papéis declarados, qualquer usuário autenticado passa
    const targets = [context.getHandler(), context.getClass()];
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (!roles?.length) return true;

    // Papel fora da lista recebe 403
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !roles.includes(user.role)) throw forbidden();
    return true;
  }
}
