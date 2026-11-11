import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { ActorRole, RequestEventType } from '../../common/types.js';
import { ServiceRequest } from './service-request.entity.js';

@Entity('request_events')
export class RequestEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  requestId: string;

  @ManyToOne(() => ServiceRequest, (request) => request.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request?: Relation<ServiceRequest>;

  @Column('text')
  type: RequestEventType;

  @Column('text', { nullable: true })
  actorId: string | null;

  @Column('text')
  actorRole: ActorRole;

  @Column('text')
  actorName: string;

  @Column('text', { nullable: true })
  note: string | null;

  @Column('text', { nullable: true })
  previousDate: string | null;

  @Column('real', { nullable: true })
  previousValue: number | null;

  @Column('text')
  createdAt: string;
}
