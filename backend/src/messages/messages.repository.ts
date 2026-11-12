import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity.js';

@Injectable()
export class MessagesRepository {
  constructor(@InjectRepository(Message) private readonly messages: Repository<Message>) {}

  findByRequest(requestId: string): Promise<Message[]> {
    // Conversa da solicitação em ordem cronológica
    return this.messages.find({ where: { requestId }, order: { createdAt: 'ASC', id: 'ASC' } });
  }

  create(data: Partial<Message>): Promise<Message> {
    // Grava uma mensagem nova
    return this.messages.save(this.messages.create(data));
  }
}
