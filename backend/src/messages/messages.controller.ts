import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/auth.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateMessageDto } from './dto/message.dto.js';
import { MessagesService, MessageView } from './messages.service.js';

@Controller('requests/:id/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(@CurrentUser() user: User, @Param('id') id: string): Promise<MessageView[]> {
    // Conversa da solicitação
    return this.messages.list(user, id);
  }

  @Roles('producer', 'provider')
  @Post()
  send(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageView> {
    // Envia uma mensagem na conversa
    return this.messages.send(user, id, dto);
  }
}
