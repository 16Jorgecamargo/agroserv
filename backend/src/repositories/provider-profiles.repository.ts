import { Injectable } from '@nestjs/common';
import { defined } from '../utils/objects.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderProfile } from '../entities/provider-profile.entity.js';

@Injectable()
export class ProviderProfilesRepository {
  constructor(
    @InjectRepository(ProviderProfile) private readonly profiles: Repository<ProviderProfile>,
  ) {}

  findByUserId(userId: string): Promise<ProviderProfile | null> {
    // Busca o perfil profissional do prestador
    return this.profiles.findOneBy({ userId });
  }

  findWithUser(userId: string): Promise<ProviderProfile | null> {
    // Busca o perfil junto com a conta do prestador
    return this.profiles.findOne({ where: { userId }, relations: { user: true } });
  }

  findUnderReview(): Promise<ProviderProfile[]> {
    // Fila de verificação, enviados há mais tempo primeiro
    return this.profiles.find({
      where: { verificationStatus: 'under_review' },
      relations: { user: true },
      order: { verificationSubmittedAt: 'ASC' },
    });
  }

  countUnderReview(): Promise<number> {
    // Total de verificações aguardando análise
    return this.profiles.countBy({ verificationStatus: 'under_review' });
  }

  create(userId: string): Promise<ProviderProfile> {
    // Cria o perfil vazio no cadastro do prestador
    return this.profiles.save(this.profiles.create({ userId }));
  }

  async update(userId: string, changes: Partial<ProviderProfile>): Promise<ProviderProfile> {
    // Aplica as mudanças e devolve o perfil atualizado
    const values = defined(changes);
    if (Object.keys(values).length) await this.profiles.update({ userId }, values);
    return this.profiles.findOneByOrFail({ userId });
  }
}
