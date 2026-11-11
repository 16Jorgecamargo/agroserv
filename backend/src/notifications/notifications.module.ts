import { Global, Module } from '@nestjs/common';
import { NotificationsInboxService } from './notifications-inbox.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsInboxService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
