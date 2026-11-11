import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PageRequest } from '../common/pagination.js';
import type { ReportStatus, ReportTargetType } from '../common/types.js';
import { Report } from './entities/report.entity.js';

@Injectable()
export class ReportsRepository {
  constructor(@InjectRepository(Report) private readonly reports: Repository<Report>) {}

  async existsForTarget(targetType: ReportTargetType, targetId: string): Promise<boolean> {
    // Diz se o alvo já foi denunciado alguma vez, em qualquer situação
    return (await this.reports.countBy({ targetType, targetId })) > 0;
  }

  async hasOpenFrom(reporterId: string, targetType: ReportTargetType, targetId: string): Promise<boolean> {
    // Diz se o usuário já tem denúncia aberta para o mesmo alvo
    return (await this.reports.countBy({ reporterId, targetType, targetId, status: 'open' })) > 0;
  }

  findById(id: string): Promise<Report | null> {
    // Busca a denúncia pelo id
    return this.reports.findOneBy({ id });
  }

  findPage(
    filters: { status?: ReportStatus; targetType?: ReportTargetType },
    page: PageRequest,
  ): Promise<[Report[], number]> {
    // Abertas: mais antigas primeiro. Demais: mais recentes primeiro
    const where = { ...(filters.status ? { status: filters.status } : {}), ...(filters.targetType ? { targetType: filters.targetType } : {}) };
    return this.reports.findAndCount({
      where,
      order: { createdAt: filters.status === 'open' ? 'ASC' : 'DESC' },
      skip: page.skip,
      take: page.pageSize,
    });
  }

  countOpen(): Promise<number> {
    // Total de denúncias aguardando análise
    return this.reports.countBy({ status: 'open' });
  }

  create(data: Partial<Report>): Promise<Report> {
    // Grava uma denúncia nova
    return this.reports.save(this.reports.create(data));
  }

  save(report: Report): Promise<Report> {
    // Grava a resolução da denúncia
    return this.reports.save(report);
  }
}
