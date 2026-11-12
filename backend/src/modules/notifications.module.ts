import { Global, Module } from '@nestjs/common';
import { NotificationsInboxService } from '../services/notifications-inbox.service.js';
import { NotificationsController } from '../controllers/notifications.controller.js';
import { NotificationsService } from '../services/notifications.service.js';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsInboxService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
