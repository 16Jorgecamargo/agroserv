import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedDaysRepository } from '../agenda/blocked-days.repository.js';
import { LoginAttemptsRepository } from '../auth/login-attempts.repository.js';
import { PasswordResetTokensRepository } from '../auth/password-reset-tokens.repository.js';
import { CategoriesRepository } from '../categories/categories.repository.js';
import { EquipmentRepository } from '../equipment/equipment.repository.js';
import { MessagesRepository } from '../messages/messages.repository.js';
import { NotificationsRepository } from '../notifications/notifications.repository.js';
import { PropertiesRepository } from '../properties/properties.repository.js';
import { ProviderProfilesRepository } from '../providers/provider-profiles.repository.js';
import { ReportsRepository } from '../reports/reports.repository.js';
import { RequestsRepository } from '../requests/requests.repository.js';
import { ReviewsRepository } from '../reviews/reviews.repository.js';
import { ServicesRepository } from '../services/services.repository.js';
import { UploadRulesService } from '../uploads/upload-rules.service.js';
import { UploadsRepository } from '../uploads/uploads.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { ENTITIES } from './entities.js';

const REPOSITORIES = [
  UsersRepository,
  ProviderProfilesRepository,
  LoginAttemptsRepository,
  PasswordResetTokensRepository,
  UploadsRepository,
  UploadRulesService,
  CategoriesRepository,
  ServicesRepository,
  PropertiesRepository,
  BlockedDaysRepository,
  NotificationsRepository,
  RequestsRepository,
  EquipmentRepository,
  MessagesRepository,
  ReviewsRepository,
  ReportsRepository,
];
import { SeedService } from './seed.service.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Garante a pasta do arquivo SQLite antes de conectar
        const database = config.getOrThrow<string>('databasePath');
        if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true });

        // Conexão SQLite com as entidades do projeto
        return {
          type: 'better-sqlite3' as const,
          database,
          entities: ENTITIES,
          synchronize: config.getOrThrow<boolean>('synchronize'),
        };
      },
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: [SeedService, ...REPOSITORIES],
  exports: [TypeOrmModule, SeedService, ...REPOSITORIES],
})
export class DatabaseModule {}
