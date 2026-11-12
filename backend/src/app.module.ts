import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './modules/admin.module.js';
import { AgendaModule } from './modules/agenda.module.js';
import { AuthModule } from './modules/auth.module.js';
import { AuthGuard, RolesGuard } from './guards/auth.guard.js';
import { CommonModule } from './modules/common.module.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { LoggerMiddleware } from './middlewares/logger.middleware.js';
import { ResponseInterceptor } from './interceptors/response.interceptor.js';
import { createValidationPipe, TrimPipe } from './pipes/validation.pipe.js';
import { loadConfig } from './config/index.js';
import { DatabaseModule } from './database/database.module.js';
import { EquipmentModule } from './modules/equipment.module.js';
import { FavoritesModule } from './modules/favorites.module.js';
import { HealthController } from './controllers/health.controller.js';
import { MessagesModule } from './modules/messages.module.js';
import { NotificationsModule } from './modules/notifications.module.js';
import { PropertiesModule } from './modules/properties.module.js';
import { ProvidersModule } from './modules/providers.module.js';
import { ReportsModule } from './modules/reports.module.js';
import { RequestsModule } from './modules/requests.module.js';
import { ReviewsModule } from './modules/reviews.module.js';
import { CatalogModule } from './modules/catalog.module.js';
import { UploadsModule } from './modules/uploads.module.js';
import { UsersModule } from './modules/users.module.js';

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
