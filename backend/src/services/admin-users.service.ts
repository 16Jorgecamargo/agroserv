import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { conflict, notFound, validationError } from '../exceptions/app.exception.js';
import { ClockService } from './clock.service.js';
import { Paginated, paginate, parsePage } from '../utils/pagination.js';
import { normalizeText, searchTerms } from '../utils/text.js';
import { ROLES } from '../types/index.js';
import type { Role } from '../types/index.js';
import { ProviderProfilesRepository } from '../repositories/provider-profiles.repository.js';
import { ProviderProfileView, toProviderProfileView } from '../presenters/provider.presenter.js';
import { RequestLifecycleService } from './request-lifecycle.service.js';
import { RequestView, toRequestView } from '../presenters/request.presenter.js';
import { RequestsRepository } from '../repositories/requests.repository.js';
import { ReviewView, toReviewView } from '../presenters/review.presenter.js';
import { ReviewsRepository } from '../repositories/reviews.repository.js';
import { ServiceView, toServiceView } from '../presenters/service.presenter.js';
import { ServicesRepository } from '../repositories/services.repository.js';
import type { User } from '../entities/user.entity.js';
import { toUserView, UserView } from '../presenters/user.presenter.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AdminActionsService, AdminActionView } from './admin-actions.service.js';
import type { CreateAdminDto } from '../dto/admin.dto.js';

export interface AdminUserDetailView {
  user: UserView;
  providerProfile?: ProviderProfileView;
  requests: RequestView[];
  services?: ServiceView[];
  reviews: ReviewView[];
  actions: AdminActionView[];
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly profiles: ProviderProfilesRepository,
    private readonly requests: RequestsRepository,
    private readonly services: ServicesRepository,
    private readonly reviews: ReviewsRepository,
    private readonly lifecycle: RequestLifecycleService,
    private readonly actions: AdminActionsService,
    private readonly auth: AuthService,
    private readonly clock: ClockService,
  ) {}

  async list(query: Record<string, unknown>): Promise<Paginated<UserView>> {
    // Busca por nome ou e-mail com filtros de papel e situação
    const page = parsePage(query, 20, 100);
    const role = ROLES.includes(query.role as Role) ? (query.role as Role) : undefined;
    const status = query.status === 'active' || query.status === 'suspended' ? query.status : undefined;
    const [users, total] = await this.users.search({ terms: searchTerms(query.q), role, status }, page);
    return paginate(users.map(toUserView), total, page);
  }

  async createAdmin(admin: User, dto: CreateAdminDto): Promise<UserView> {
    // O e-mail segue a mesma regra de unicidade do cadastro
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw validationError({ email: 'Este e-mail já está cadastrado.' });
    }

    // A senha é provisória: o novo administrador troca no primeiro acesso
    const created = await this.users.create({
      name: dto.name,
      email,
      passwordHash: await this.auth.hashPassword(dto.password),
      role: 'admin',
      city: dto.city,
      state: dto.state,
      status: 'active',
      mustChangePassword: true,
      searchText: normalizeText(`${dto.name} ${email}`),
      createdAt: this.clock.nowIso(),
    });
    await this.actions.log(admin, 'create_admin', { type: 'user', id: created.id, label: created.name });
    return toUserView(created);
  }

  async detail(id: string): Promise<AdminUserDetailView> {
    // Dados da conta, com o que ela fez e o que foi feito sobre ela
    const user = await this.load(id);
    const isProvider = user.role === 'provider';
    const profile = isProvider ? await this.profiles.findByUserId(id) : null;
    const requests = await this.requests.findRecentByParticipant(id, 20);
    const services = isProvider ? await this.services.findByProvider(id) : null;
    const reviews = await this.reviews.findAll(isProvider ? { providerId: id } : { producerId: id });
    return {
      user: toUserView(user),
      ...(profile ? { providerProfile: toProviderProfileView(profile) } : {}),
      requests: requests.map(toRequestView),
      ...(services ? { services: services.map((service) => toServiceView(service, true)) } : {}),
      reviews: reviews.map(toReviewView),
      actions: await this.actions.listForTarget(id),
    };
  }

  async suspend(admin: User, id: string, reason: string): Promise<UserView> {
    // Bloqueios: a própria conta, o último administrador e conta já suspensa
    const user = await this.load(id);
    if (user.id === admin.id) throw conflict('Você não pode suspender a sua própria conta.');
    if (user.role === 'admin' && user.status === 'active' && (await this.users.countActiveAdmins()) <= 1) {
      throw conflict('É preciso manter pelo menos um administrador ativo.');
    }
    if (user.status === 'suspended') throw conflict('Esta conta já está suspensa.');

    // A conta para de entrar e o sistema cancela o que ela tinha em aberto
    const suspended = await this.users.update(id, { status: 'suspended' });
    await this.lifecycle.cancelOpenRequestsOf(id);
    await this.actions.log(admin, 'suspend_user', { type: 'user', id, label: user.name }, reason);
    return toUserView(suspended);
  }

  async reactivate(admin: User, id: string): Promise<UserView> {
    // Só contas suspensas voltam; as excluídas ficam como estão
    const user = await this.findAny(id);
    if (user.status === 'deleted') throw conflict('Contas excluídas não podem ser reativadas.');
    if (user.status === 'active') throw conflict('Esta conta já está ativa.');
    const active = await this.users.update(id, { status: 'active' });
    await this.actions.log(admin, 'reactivate_user', { type: 'user', id, label: user.name });
    return toUserView(active);
  }

  async findAny(id: string): Promise<User> {
    // Localiza a conta mesmo excluída, para o detalhe das denúncias
    const user = await this.users.findById(id);
    if (!user) throw notFound('user_not_found', 'Usuário não encontrado.');
    return user;
  }

  private async load(id: string): Promise<User> {
    // Contas excluídas não aparecem para ações administrativas
    const user = await this.users.findById(id);
    if (!user || user.status === 'deleted') throw notFound('user_not_found', 'Usuário não encontrado.');
    return user;
  }
}
