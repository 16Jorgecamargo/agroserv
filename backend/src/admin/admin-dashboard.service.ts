import { Injectable } from '@nestjs/common';
import { ClockService } from '../common/clock.service.js';
import type { RequestStatus } from '../common/types.js';
import { ProviderProfilesRepository } from '../providers/provider-profiles.repository.js';
import { ReportsRepository } from '../reports/reports.repository.js';
import { RequestsRepository } from '../requests/requests.repository.js';
import { ServicesRepository } from '../services/services.repository.js';
import { UsersRepository } from '../users/users.repository.js';

export interface AdminDashboardView {
  users: { producers: number; providers: number; admins: number };
  newUsersLast7Days: number;
  requestsByStatus: Record<RequestStatus, number>;
  activeServices: number;
  topCategories: { categoryId: string; name: string; requests: number }[];
  pendingVerifications: number;
  openReports: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly users: UsersRepository,
    private readonly requests: RequestsRepository,
    private readonly services: ServicesRepository,
    private readonly profiles: ProviderProfilesRepository,
    private readonly reports: ReportsRepository,
    private readonly clock: ClockService,
  ) {}

  async overview(): Promise<AdminDashboardView> {
    // Números gerais da plataforma, calculados no banco
    const roles = await this.users.countByRole();
    return {
      users: { producers: roles.producer, providers: roles.provider, admins: roles.admin },
      newUsersLast7Days: await this.users.countCreatedSince(this.clock.isoFromNow(-WEEK_MS)),
      requestsByStatus: await this.requests.countByStatus(),
      activeServices: await this.services.countVisible(),
      topCategories: await this.requests.topCategories(5),
      pendingVerifications: await this.profiles.countUnderReview(),
      openReports: await this.reports.countOpen(),
    };
  }
}
