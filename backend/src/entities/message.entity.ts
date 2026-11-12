import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { Role } from '../types/index.js';
import { ServiceRequest } from './service-request.entity.js';
import { User } from './user.entity.js';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  requestId: string;

  @ManyToOne(() => ServiceRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request?: Relation<ServiceRequest>;

  @Column('text')
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender?: Relation<User>;

  @Column('text')
  senderName: string;

  @Column('text')
  senderRole: Role;

  @Column('text')
  text: string;

  @Column('text')
  createdAt: string;
}
