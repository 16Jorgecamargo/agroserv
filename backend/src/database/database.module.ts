import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from './entities.js';
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
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}
