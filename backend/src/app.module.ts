import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AgendaModule } from './agenda/agenda.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard, RolesGuard } from './common/auth.guard.js';
import { CommonModule } from './common/common.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { LoggerMiddleware } from './common/logger.middleware.js';
import { ResponseInterceptor } from './common/response.interceptor.js';
import { createValidationPipe, TrimPipe } from './common/validation.pipe.js';
import { loadConfig } from './config.js';
import { DatabaseModule } from './database/database.module.js';
import { EquipmentModule } from './equipment/equipment.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { HealthController } from './health/health.controller.js';
import { MessagesModule } from './messages/messages.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { CatalogModule } from './services/catalog.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig], ignoreEnvFile: process.env.NODE_ENV === 'test' }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
    UploadsModule,
    NotificationsModule,
    CatalogModule,
    PropertiesModule,
    RequestsModule,
    MessagesModule,
    ReviewsModule,
    EquipmentModule,
    AgendaModule,
    AdminModule,
    FavoritesModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_PIPE, useClass: TrimPipe },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Registra o log em todas as rotas
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
