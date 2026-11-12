import type { Role, UserStatus } from '../types/index.js';
import type { User } from '../entities/user.entity.js';

export interface UserView {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  city: string;
  state: string;
  status: UserStatus;
  mustChangePassword?: boolean;
  createdAt: string;
}

export function toUserView(user: User): UserView {
  // Converte a entidade no tipo User do contrato, sem campos internos
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    city: user.city,
    state: user.state,
    status: user.status,
    ...(user.mustChangePassword ? { mustChangePassword: true } : {}),
    createdAt: user.createdAt,
  };
}
