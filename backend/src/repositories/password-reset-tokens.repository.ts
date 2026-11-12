import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity.js';

@Injectable()
export class PasswordResetTokensRepository {
  constructor(
    @InjectRepository(PasswordResetToken) private readonly tokens: Repository<PasswordResetToken>,
  ) {}

  countSince(userId: string, since: string): Promise<number> {
    // Conta os pedidos recentes da conta
    return this.tokens.countBy({ userId, createdAt: MoreThan(since) });
  }

  async invalidateAll(userId: string, usedAt: string): Promise<void> {
    // Um pedido novo invalida os links anteriores
    await this.tokens.update({ userId, usedAt: IsNull() }, { usedAt });
  }

  async create(data: Partial<PasswordResetToken>): Promise<void> {
    // Guarda só o hash do token
    await this.tokens.save(this.tokens.create(data));
  }

  findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    // Localiza o pedido pelo hash do token recebido
    return this.tokens.findOneBy({ tokenHash });
  }
}
