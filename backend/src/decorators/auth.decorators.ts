import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../entities/user.entity.js';
import type { Role } from '../types/index.js';

export const PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Marca a rota como aberta a visitantes
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(PUBLIC_KEY, true);

// Restringe a rota aos papéis informados
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined => {
    // Entrega ao controller o usuário identificado pelo guard
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);
