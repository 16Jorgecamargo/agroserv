import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { LoginAttempt } from '../entities/login-attempt.entity.js';

@Injectable()
export class LoginAttemptsRepository {
  constructor(
    @InjectRepository(LoginAttempt) private readonly attempts: Repository<LoginAttempt>,
  ) {}

  countSince(email: string, since: string): Promise<number> {
    // Conta as tentativas erradas recentes do e-mail
    return this.attempts.countBy({ email, createdAt: MoreThan(since) });
  }

  async register(email: string, createdAt: string): Promise<void> {
    // Registra uma tentativa errada
    await this.attempts.save(this.attempts.create({ email, createdAt }));
  }

  async clear(email: string): Promise<void> {
    // Zera as tentativas depois de um login correto
    await this.attempts.delete({ email });
  }
}
