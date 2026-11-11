import {
  Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, type Relation,
} from 'typeorm';
import type { ActorRole, PriceUnit, RequestStatus } from '../../common/types.js';
import { Property } from '../../properties/entities/property.entity.js';
import { Service } from '../../services/entities/service.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { RequestEvent } from './request-event.entity.js';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service?: Relation<Service>;

  @Column('text')
  serviceTitle: string;

  @Index()
  @Column('text')
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider?: Relation<User>;

  @Column('text')
  providerName: string;

  @Index()
  @Column('text')
  producerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'producerId' })
  producer?: Relation<User>;

  @Column('text')
  producerName: string;

  @Column('text')
  propertyId: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property?: Relation<Property>;

  @Column('text')
  location: string;

  @Column('text')
  scheduledDate: string;

  @Column('real')
  quantity: number;

  @Column('text')
  priceUnit: PriceUnit;

  @Column('real')
  value: number;

  @Column('text', { nullable: true })
  notes: string | null;

  @Index()
  @Column('text', { default: 'pending' })
  status: RequestStatus;

  @Column('text', { nullable: true })
  counterDate: string | null;

  @Column('real', { nullable: true })
  counterValue: number | null;

  @Column('text', { nullable: true })
  counterMessage: string | null;

  @Column('text', { nullable: true })
  counterCreatedAt: string | null;

  @Column('text', { nullable: true })
  rejectReason: string | null;

  @Column('text', { nullable: true })
  cancelReason: string | null;

  @Column('text', { nullable: true })
  cancelledBy: ActorRole | null;

  @Column('text', { nullable: true })
  reviewId: string | null;

  @OneToMany(() => RequestEvent, (event) => event.request)
  events?: Relation<RequestEvent[]>;

  @Column('text')
  createdAt: string;

  @Column('text')
  updatedAt: string;
}
