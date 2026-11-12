import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminActionsRepository } from '../repositories/admin-actions.repository.js';
import { BlockedDaysRepository } from '../repositories/blocked-days.repository.js';
import { LoginAttemptsRepository } from '../repositories/login-attempts.repository.js';
import { PasswordResetTokensRepository } from '../repositories/password-reset-tokens.repository.js';
import { CategoriesRepository } from '../repositories/categories.repository.js';
import { EquipmentRepository } from '../repositories/equipment.repository.js';
import { FavoritesRepository } from '../repositories/favorites.repository.js';
import { MessagesRepository } from '../repositories/messages.repository.js';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PropertiesRepository } from '../repositories/properties.repository.js';
import { ProviderProfilesRepository } from '../repositories/provider-profiles.repository.js';
import { ReportsRepository } from '../repositories/reports.repository.js';
import { RequestsRepository } from '../repositories/requests.repository.js';
import { ReviewsRepository } from '../repositories/reviews.repository.js';
import { ServicesRepository } from '../repositories/services.repository.js';
import { UploadRulesService } from '../services/upload-rules.service.js';
import { UploadsRepository } from '../repositories/uploads.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { ENTITIES } from './entities.js';
import { MIGRATIONS } from './migrations/index.js';

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
  AdminActionsRepository,
  FavoritesRepository,
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
          migrations: MIGRATIONS,
          migrationsRun: true,
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
