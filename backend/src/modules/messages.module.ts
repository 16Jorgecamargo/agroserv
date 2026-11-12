import { Module } from '@nestjs/common';
import { MessagesController } from '../controllers/messages.controller.js';
import { MessagesService } from '../services/messages.service.js';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
